# AWS IAM ユーザーの運用を考えてみた話
<a id="top"></a>

- AWS コンソールにログインするユーザーの権限を最小限にする
- 作業用ロールにスイッチして作業


###### CONTENTS

1. [なんでそんなことをするのか](#purpose)
1. [ユーザーの作成](#create-user)
1. [パスワードと MFA の設定ができるポリシーの作成](#create-basic-policy)
1. [作業用ロールの作成](#create-admin-role)
1. [作業用ロールへスイッチできるようにする](#switch-role)
1. [作業用ロールへスイッチしてみる](#test-switch-role)
1. [まとめ](#postscript)
1. [参考資料](#reference)


<a id="purpose"></a>
### なんでそんなことをするのか

一人で作業しているので、何となく気持ち悪さを感じつつ root ユーザーで作業していた。
もちろん MFA は設定しているし、プログラムからのアクセスはそれ用のポリシーしか持っていないやつを作ってやってる。

技術書典に行ったとき「[AWS IAM のマニアックな話](https://booth.pm/ja/items/1563844)」を買って、見直す機会を得たので見直してみる。

- もう半年経ってる（時の流れははやいなあ）

この記事はこの本のチュートリアルの章をトレースしてるだけな内容。


[TOP](#top)
<a id="create-user"></a>
### ユーザーの作成

普段使いするユーザーを作成する。
コンソールログイン用のユーザーとして作成。

まずは何のポリシーも持たない状態で作成する。
そうすると何もできないユーザーが出来上がる。
このユーザーに作業用のポリシーをつけていく。


[TOP](#top)
<a id="create-basic-policy"></a>
### パスワードと MFA の設定ができるポリシーの作成

何もできないとは、自分のパスワードも変更できないし、MFA の設定もできない状態である。
これでは本当に何もできないので、これを許可するポリシーを付け足す。

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "iam:DeactivateMFADevice",
        "iam:DeleteVirtualMFADevice",
        "iam:EnableMFADevice",
        "iam:ResyncMFADevice",
        "iam:CreateVirtualMFADevice",
        "iam:ListMFADevices",
        "iam:ChangePassword"
      ],
      "Resource": [
        "arn:aws:iam::000000000000:user/${aws:username}",
        "arn:aws:iam::000000000000:mfa/${aws:username}"
      ]
    }
  ]
}
```

`000000000000` のところは自分のアカウント ID にする。
`${aws:username}` はこの内容で良くて、ポリシーが割り当てられるときに自分自身のユーザーに変換されるらしい。

このポリシーをつけると、パスワードの変更と MFA の設定ができるようになる。


[TOP](#top)
<a id="create-admin-role"></a>
### 作業用ロールの作成

ユーザーは switch role で必要なロールにスイッチして作業する。
ユーザーが作業するために必要な最小限の権限を渡すように設計したい。
が、一人で作業していることもあってわざわざ分けるのめんどくさいのでとりあえず AdministratorAccess を使用する。

- このポリシー設計については「[AWS IAM のマニアックな話](https://booth.pm/ja/items/1563844)」を読もう


[TOP](#top)
<a id="switch-role"></a>
### 作業用ロールへスイッチできるようにする

作業に必要な最小限のポリシーをつけたロールを作成したら、ユーザーがこのロールへスイッチできるようにする。

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "sts:AssumeRole",
      "Resource": "arn:aws:iam::000000000000:role/ROLENAME",
      "Condition": {
        "BoolIfExists": {
          "aws:MultiFactorAuthPresent": "true"
        }
      }
    }
  ]
}
```

`000000000000` のところは自分のアカウント ID にする。
`ROLENAME` は作成したロールの名前にする。

このポリシーをつけると、作成したロールへスイッチできるようになる。
また、MFA が設定されていなければスイッチできないようにしている。

さらに、スイッチロールするためにはロールの「信頼関係」を変更する必要がある。

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::000000000000:user/USERNAME"
      },
      "Action": "sts:AssumeRole",
      "Condition": {
        "Bool": {
          "aws:MultiFactorAuthPresent": "true"
        }
      }
    }
  ]
}
```

`000000000000` のところは自分のアカウント ID にする。
`USERNAME` はスイッチを許可するユーザーの名前にする。

ここで列挙したユーザーしかこのロールにスイッチできない。


[TOP](#top)
<a id="test-switch-role"></a>
### 作業用ロールへスイッチしてみる

作成したユーザーでログインして MFA の設定をしたら、作業用ロールにスイッチしてみる。

- MFA は画面右上のユーザーのプルダウンの中の「マイセキュリティ資格情報」から設定できる
- ユーザーにつけたポリシーの内容を変更した場合はいったんログインしなおす必要がある


[TOP](#top)
<a id="postscript"></a>
### まとめ

IAM ユーザーの運用を考えてみた。

まあ実際の運用は root ユーザー運用の時とほとんど変わらないけど、root ユーザーを使わなくなるからそれだけでもいいかな。
最近 aws のログイン画面も変わって root 使うな感が出てきたし。

aws を扱う人がたくさんいる場合はちゃんと考えないといけないんだろうな。


[TOP](#top)
<a id="reference"></a>
### 参考資料

- [AWS IAM のマニアックな話](https://booth.pm/ja/items/1563844)


[TOP](#top)
