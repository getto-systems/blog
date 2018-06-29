# GKE で本番環境の構成を考えた
<a id="top"></a>

- GKE でクラスタを作成
- nginx-ingress コントローラを使用して ingress を構成
- cert-manager で Let's Encrypt
- CloudSQL にデータベースを用意
- 複数ドメイン、複数サービスで構築

###### CONTENTS

1. [全体の構成](#overview)
1. [クラスタの作成](#create-cluster)
1. [Helm セットアップ](#setup-helm)
1. [CloudSQL を使用するための準備](#setup-cloudsql)
1. [nginx-ingress を使用してデプロイ](#deploy-application)
1. [Let's Encrypt で TLS 証明書を取得](#request-certificte)
1. [CORS 設定、DB アクセスの確認、その他](#check-response)
1. [まとめ](#postscript)
1. [参考資料](#reference)

###### APPENDIX

1. [deployment.yaml](#deployment-yaml)
1. [service.yaml](#service-yaml)
1. [ingress.yaml](#ingress-yaml)
1. [ingress-tls.yaml](#ingress-tls-yaml)
1. [certificate.yaml](#certificate-yaml)


###### ENVIRONMENTS

- kubernetes : 1.10.4-gke.2


<a id="overview"></a>
### 全体の構成

![https://gyazo.com/286f6db17e70caf578cd3924def6e2e5](https://i.gyazo.com/286f6db17e70caf578cd3924def6e2e5.png)

今の理解を図にしてみた。
複数ノードのクラスタにサービスが乗っかって、ロードバランサーがリクエストを捌く、というイメージ。
よくわかっていないので間違っている点もあるだろうが、現在の理解として。


[TOP](#top)
<a id="create-cluster"></a>
### クラスタの作成

GCP のコントロールパネルでクラスタを作成した。
コマンドラインから作成する方法もあるはずだが、調べていない。

クラスタのバージョンは作業時の最新だった 1.10.4-gke.2 を選択した。
この記事を書いている最中にバージョンアップが来ていたので、今後自動アップグレードの確認をしたい。

最小マシンタイプは small だろう。
micro にしたら、おそらくメモリ不足のために新しいバージョンの pod の起動がうまくいかなくなった。

HTTP 負荷分散は OFF にしておく。
これは GKE が用意した ingress controller を使用するかどうかの設定。
GKE のコントローラでは、CORS 設定がうまくいかなかった。
このため、nginx-ingress を使用する。

色々と試行錯誤したので、うまくいかないのは勘違いの可能性もある。
ただ、ドキュメントを見ると nginx-ingress の方が多機能なように見えるので、こちらを採用した。

作成を選択すると、クラスタの作成が開始。
しばらくすると GCE のインスタンスが、指定したノード数だけ立ち上がって準備完了。


[TOP](#top)
<a id="setup-helm"></a>
### Helm セットアップ

ここからは Google Cloud Shell を使用してセットアップを行なった。
gcloud と kubectl が使用できればいいので、環境があればそれを使用すれば良い。

以下のコマンドで kubectl が使用可能になる。

```
gcloud container clusters get-credentials \
  [CLUSTER-NAME] --zone [ZONE] --project [PROJECT-NAME]
```

ちなみに、ワークロードの画面でシステムワークロードを選択して、メニューから KUBECTL の EDIT を選択すると shell が立ち上がってこのコマンドが表示される。

[Helm Documentation](https://docs.helm.sh/using_helm/#installing-helm) を参考に Helm をインストールする。
今回は Google Cloud Shell を使用しているので、単に tar で落とした。

コマンドが使用可能になったら、サービスアカウントの設定を行う。
今回は cluster-admin を指定しているが、本来は細かく設定するべきだろう。
詳しく調べられていない。

```
kubectl create serviceaccount -n kube-system tiller
kubectl create clusterrolebinding tiller-binding \
    --clusterrole=cluster-admin \
    --serviceaccount kube-system:tiller

helm init --service-account tiller
helm repo update
```

これで Helm を使用する準備が整った。


[TOP](#top)
<a id="setup-cloudsql"></a>
### CloudSQL を使用するための準備

アプリケーションが使用するデータベースは、CloudSQL を選択した。

理由は、GKE でアプリケーションを配備するため、Google のサービスならセットアップが簡単だろうというだけ。
ベンダーをまたがってクラスタを構成するのは今後の課題。

CloudSQL に接続するための準備をしていく。

[Google Kubernetes Engineから接続する &nbsp;|&nbsp; Cloud SQL for MySQL &nbsp;|&nbsp; Google Cloud](https://cloud.google.com/sql/docs/mysql/connect-container-engine)

基本この通りに進めていく。

- Cloud SQL Administration API を有効化
- CloudSQL インスタンスのあるプロジェクトにサービスアカウントを作成
- Cloud SQL クライアントのロールを追加
- 「新しい秘密鍵の提供」で JSON ファイルをダウンロード

JSON ファイルは shell でアクセスできる場所にコピーしておく。
機密情報なので扱いは慎重に。

次は、CloudSQL のインスタンスに `[USER]@cloudsqlproxy~%` ユーザーを追加する。
`cloudsqlproxy~%` からのアクセスが出来るように。
接続にはパスワードが必須に設定してあるので、パスワードも設定した。

コンテナからこれらの機密情報にアクセスできるように、secret を作成する。

```
kubectl create secret generic cloudsql-instance-credentials \
  --from-file=credentials.json=[PROXY_KEY_FILE_PATH]

kubectl create secret generic cloudsql-db-credentials \
  --from-literal=username=[USER] --from-literal=password=[PASSWORD]
```

`PROXY_KEY_FILE_PATH` は、先にダウンロードしておいた JSON ファイルのパスを指定する。

コンテナから機密情報にアクセスするため secret を使用する、というのは理解できた。けど、secret の生成方法はこんなのでいいのか、という点については今後の課題。

これでデータベースアクセスの準備が整った。


[TOP](#top)
<a id="deploy-application"></a>
### nginx-ingress を使用してデプロイ

まず、サンプルアプリケーションを配備する。

```
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
```

今回使用した [deployment.yaml](#deployment-yaml) と [service.yaml](#service-yaml) は、記事の最後に例を記載した。

ワークロードとサービスの画面で、ちやんと立ち上がっていることを確認する。
これがうまく動いていなければどうにもならない。

アプリケーションは、以下の構成にしておく。

- `/` : アクセス確認のために適当なレスポンスで応答
- `/healthz` : ステータス 200 で応答
- WEB アプリケーションとやりとりする部分

今回は WEB の API として使用するので、その部分は実装しておいた。
実装の詳細は公開できる準備が~~面倒~~できていないので割愛。

また、`/healthz` は nginx-ingress のヘルスチェックに使用されるので、これがステータス 200 で応答しないとアプリケーションまでリクエストが来ない。

コンテナイメージが正しくできているかは、ローカルで確認しておくこと。
正しく動くかどうかをクラスタにデプロイしてから確認するようなことをすると、何が原因で失敗しているのかもう訳が分からなくなる。

アプリケーションが配備できたら、nginx-ingress をインストールする。

```
helm install stable/nginx-ingress \
  --name [NAME] --set rbac.create=true
```

しばらくするとロードバランサー付きで nginx-ingress-controller が立ち上がる。

この IP アドレスを DNS に登録する。
この記事では、`app1.example.com` で登録したとして進める。

nginx-ingress-controller が立ち上がったら、 ingress を登録。

```
kubectl apply -f ingress.yaml
```

今回使用した [ingress.yaml](#ingress-yaml) は、記事の最後に例を記載した。

`app1.example.com` にアクセスして正しくレスポンスが返ってくることを確認。

```
curl http://app1.example.com
```

アクセスできない場合は service.yaml の サービス名、ポートが ingress.yaml と合っているか確認。

ロードバランサーに設定が伝わるまでに、5〜10分かかることがある。
このため、うまくいってるのか、間違っているのかの判断がつらかった。

レスポンスが返ってきたら ingress の設定は完了。

デフォルトでは nginx-ingress-controller は 1つしか立ち上がらないので、これを 2 にスケールしておいた。
必要かどうかはわからない。


[TOP](#top)
<a id="request-certificte"></a>
### Let's Encrypt で TLS 証明書を取得

アプリケーションに TLS アクセスするため、ingress に TLS の設定を行う必要がある。

今回は Let's Encrypt を使用して証明書を取得する。

[ahmetb/gke-letsencrypt: Tutorial for installing cert-manager to get HTTPS certificates from Let’s Encrypt](https://github.com/ahmetb/gke-letsencrypt)

ここの手順どおりに作業を進めていく。

Helm のセットアップは済んでいるので、cert-manager のインストールを行う。

```
helm install --name cert-manager \
    --namespace kube-system stable/cert-manager
```

cert-manager が使用する issuer を作成する。
テンプレートが用意されているので、それを使用する。

```
curl -sSL https://rawgit.com/ahmetb/gke-letsencrypt/master/yaml/letsencrypt-issuer.yaml | \
  sed -e "s/email: ''/email: $EMAIL/g" > letsencrypt-issuer.yaml

kubectl apply -f letsencrypt-issuer.yaml
```

issuer を作成したら、certificate を作成する。

```
kubectl apply -f certificate.yaml
```

今回使用した [certificate.yaml](#certificate-yaml) は、記事の最後に例を記載した。

certificate を作成すると、証明書のリクエストが始まる。
取得状況は describe で確認できる。

```
kubectl describe -f certificate.yaml

...
Type     Reason                Message
----     ------                -------
Warning  ErrorCheckCertificate Error checking existing TLS certificate: secret "www-dogs-com-tls" not found
Normal   PrepareCertificate    Preparing certificate with issuer
Normal   PresentChallenge      Presenting http-01 challenge for domain foo.kubernetes.tips
Normal   SelfCheck             Performing self-check for domain www.dogs.com
Normal   ObtainAuthorization   Obtained authorization for domain www.dogs.com
Normal   IssueCertificate      Issuing certificate...
Normal   CeritifcateIssued     Certificated issued successfully
Normal   RenewalScheduled      Certificate scheduled for renewal in 1438 hours
```

[gke-letsencrypt/50-get-a-certificate.md at master · ahmetb/gke-letsencrypt](https://github.com/ahmetb/gke-letsencrypt/blob/master/50-get-a-certificate.md)

ここから例を引用。
実際の出力は取っておくのを忘れた。

成功すると、secret が生成されるので、ingress の設定を更新する。

```
kubectl apply -f ingress-tls.yaml
```

今回使用した [ingress-tls.yaml](#ingress-tls-yaml) は、記事の最後に例を記載した。

`app1.example.com` にアクセスして正しくレスポンスが返ってくることを確認。

```
curl https://app1.example.com
```

デフォルトでは、tls 設定があると、https へリダイレクトするようになっている。
同じ ingress で複数ドメイン運用をするので、今後のリクエストのために http アクセスが出来るようにしておく。

```
annotations:
  nginx.ingress.kubernetes.io/ssl-redirect: "false"
```

レスポンスが返ってきたら tls の設定は完了。


[TOP](#top)
<a id="check-response"></a>
### CORS 設定、DB アクセスの確認、その他

ここまできたら、用意しておいた WEB アプリケーションから API にアクセスできるようになっているはず。

今回はログインできることを確認できれば、CORS の設定と DB のアクセスが確認できるような構成で実装しておいた。
ここまで来るのに相当試行錯誤しているので、アクセスが成功した時はだいぶ嬉しかった。

最後に、nginx-ingress-controller に紐付いている IP アドレスを静的 IP として予約しておく。


[TOP](#top)
<a id="postscript"></a>
### まとめ

この構成で本番運用ができるのでは、と思っているが実際どうなるかは今後の運用次第。
今はこれで設定しました、という段階。

アプリケーションのデプロイは Container Builder を使用することで自動化できる。
これについては別な記事で。


[TOP](#top)
<a id="reference"></a>
### 参考資料

- [Helm Documentation](https://docs.helm.sh/using_helm/#installing-helm)
- [GKEからCloud SQLに接続する方法 - まーぽんって誰がつけたの？](http://www.mpon.me/entry/2017/04/22/025029)
- [Google Kubernetes Engineから接続する &nbsp;|&nbsp; Cloud SQL for MySQL &nbsp;|&nbsp; Google Cloud](https://cloud.google.com/sql/docs/mysql/connect-container-engine)
- [ahmetb/gke-letsencrypt: Tutorial for installing cert-manager to get HTTPS certificates from Let’s Encrypt](https://github.com/ahmetb/gke-letsencrypt)
- [Ingress - Kubernetes](https://kubernetes.io/docs/concepts/services-networking/ingress/#simple-fanout)
- [Deployments - Kubernetes](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)
- [Services - Kubernetes](https://kubernetes.io/docs/concepts/services-networking/service/#type-nodeport)
- [Secrets - Kubernetes](https://kubernetes.io/docs/concepts/configuration/secret/)
- [Installation Guide - NGINX Ingress Controller](https://kubernetes.github.io/ingress-nginx/deploy/)
- [Annotations - NGINX Ingress Controller](https://kubernetes.github.io/ingress-nginx/user-guide/nginx-configuration/annotations/)


[TOP](#top)
<a id="deployment-yaml"></a>
#### deployment.yaml

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app
  labels:
    app: rails
spec:
  replicas: 2
  revisionHistoryLimit: 0
  selector:
    matchLabels:
      app: rails
  template:
    metadata:
      labels:
        app: rails
    spec:
      containers:
      - name: rails
        image: IMAGE
        ports:
        - containerPort: 3000
        env:
          - name: DB_USERNAME
            valueFrom:
              secretKeyRef:
                name: cloudsql-db-credentials
                key: username
          - name: DB_PASSWORD
            valueFrom:
              secretKeyRef:
                name: cloudsql-db-credentials
                key: password
      - image: gcr.io/cloudsql-docker/gce-proxy:1.09
        name: cloudsql-proxy
        command: ["/cloud_sql_proxy", "--dir=/cloudsql",
                  "-instances=INSTANCE=tcp:3306",
                  "-credential_file=/secrets/cloudsql/credentials.json"]
        volumeMounts:
          - name: cloudsql-instance-credentials
            mountPath: /secrets/cloudsql
            readOnly: true
          - name: ssl-certs
            mountPath: /etc/ssl/certs
          - name: cloudsql
            mountPath: /cloudsql
            volumes:
      volumes:
      - name: cloudsql-instance-credentials
        secret:
          secretName: cloudsql-instance-credentials
      - name: ssl-certs
        hostPath:
          path: /etc/ssl/certs
      - name: cloudsql
        emptyDir:
```

コンテナのイメージ `IMAGE` と CloudSQL のインスタンス名 `INSTANCE` を、使用しているものに置き換える必要がある。

アプリケーションからデータベースへは、`ENV[DB_USERNAME]@127.0.0.1` にパスワード `ENV[DB_PASSWORD]` でアクセス可能。

[TOP](#top)
<a id="service-yaml"></a>
#### service.yaml

```yaml
apiVersion: v1
kind: Service
metadata:
  name: rails
spec:
  type: NodePort
  selector:
    app: rails
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
```

[TOP](#top)
<a id="ingress-yaml"></a>
#### ingress.yaml

```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  name: ingress
  annotations:
    kubernetes.io/ingress.global-static-ip-name: STATIC_IP_NAME
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/ssl-redirect: "false"
    nginx.ingress.kubernetes.io/enable-cors: "false"
    nginx.ingress.kubernetes.io/cors-allow-methods: "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD"
    nginx.ingress.kubernetes.io/cors-allow-origin: "https://app1.example.com"
spec:
  rules:
  - host: app1.example.com
    http:
      paths:
      - backend:
          serviceName: rails
          servicePort: 80
```

静的 IP 名 `STATIC_IP_NAME` とドメイン `app1.example.com` を、使用しているものに置き換える必要がある。

serviceName と servicePort は service.yaml のものと合わせる。

複数ドメイン運用する場合は、`cors-allow-origin` にスペース区切りで指定する。

[TOP](#top)
<a id="ingress-tls-yaml"></a>
#### ingress-tls.yaml

```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  name: ingress
  annotations:
    kubernetes.io/ingress.global-static-ip-name: STATIC_IP_NAME
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/ssl-redirect: "false"
    nginx.ingress.kubernetes.io/enable-cors: "false"
    nginx.ingress.kubernetes.io/cors-allow-methods: "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD"
    nginx.ingress.kubernetes.io/cors-allow-origin: "https://app1.example.com"
spec:
  rules:
  - host: app1.example.com
    http:
      paths:
      - backend:
          serviceName: prograde-gift-confirmation-rails
          servicePort: 80
  tls:
  - secretName: ingress-tls
    hosts:
    - app1.example.com
```

ingress.yaml とは、 `spec.tls` の設定だけ異なる。

secretName は certificate.yaml で指定するものを使用する。

[TOP](#top)
<a id="certificate-yaml"></a>
#### certificate.yaml

```yaml
# Copyright 2018 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
apiVersion: certmanager.k8s.io/v1alpha1
kind: Certificate
metadata:
  name: ingress-tls
  namespace: default
spec:
  secretName: ingress-tls
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  commonNames:
  - app1.example.com
  dnsNames:
  - app1.example.com
  acme:
    config:
    - http01:
        ingress: ingress
      domains:
      - app1.example.com
```

`spec.issuerRef.name` には、`letsencrypt-prod` と `letsencrypt-staging` が使用できる。

staging の方はテスト用の証明書を取得する。
prod は取得回数に制限があるので、試行錯誤する場合は staging の方でリクエストするようにする。

`spec.acme.config.http01.ingress` には、ingress.yaml で指定した ingress 名を設定する。

この設定では、 http でチェックする方式でリクエストする。
他に、dns のオプションもあるが、調べられていない。

commonNames、dnsNames、domains に、必要なドメインを複数列挙すれば、複数ドメインで証明書を取得できる。

[TOP](#top)
