# Ruby で gRPC Stream する話
<a id="top"></a>

###### CONTENTS

1. [なにがやりたいのか](#purpose)
1. [proto の定義](#define-proto)
1. [サーバー側のコード](#server)
1. [クライアント側のコード](#client)
1. [まとめ](#postscript)
1. [参考資料](#reference)


###### ENVIRONMENTS

- Ruby : 2.6.5
- grpc : 1.24.0
- grpc-tools : 1.24.0


<a id="purpose"></a>
### なにがやりたいのか

[gRPC Basics - Ruby | gRPC Documentation](https://grpc.io/docs/tutorials/basic/ruby/) に書いてあるとおりだな。

Rust でやってそれをまとめよう。

できれば JS まで gRPC したいけど、間に proxy はさんでいけるのかな。
だめなら grpc-gateway みたいな名前の json で RESTful api にするやつがあったはず。


[TOP](#top)
<a id="define-proto"></a>
### proto の定義


[TOP](#top)
<a id="server"></a>
### サーバー側のコード


[TOP](#top)
<a id="client"></a>
### クライアント側のコード


[TOP](#top)
<a id="postscript"></a>
### まとめ

2018年現在の開発環境の構築方法をまとめた。


[TOP](#top)
<a id="reference"></a>
### 参考資料

- [gRPC Basics - Ruby | gRPC Documentation](https://grpc.io/docs/tutorials/basic/ruby/)
- [RubyでgRPCのストリーミング | Qiita](https://qiita.com/yururit/items/bc7c0eda63d5fa30289a)


[TOP](#top)
