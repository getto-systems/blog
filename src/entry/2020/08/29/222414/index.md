# TypeScript で protocol buffers する話
<a id="top"></a>

###### CONTENTS

1. [なぜそんなことをするのか](#purpose)
1. [protobufjs のインストール](#install-protobufjs)
1. [proto ファイル定義](#define-proto)
1. [コード生成](#generate-code)
1. [エンコード](#encode)
1. [デコード](#decode)
1. [まとめ](#postscript)
1. [参考資料](#reference)


###### ENVIRONMENTS

- TypeScript : 4.0.2
- protobufjs : 6.10.1


<a id="purpose"></a>
### なぜそんなことをするのか

- API との通信で使用したい
- Local Storage への保存で使用したい

API や永続化層とのやり取りで protocol buffers を使用したい。
単に JSON を使用する場合、フィールド名の変更がやりにくい。
protocol buffers を使用すれば、フィールド名の変更はやり放題。
最近 DDD で書こうとしている関係で名前の変更しやすさは重要。


[TOP](#top)
<a id="install-protobufjs"></a>
### protobufjs のインストール

javascript から protocol buffers するには [protobufjs](https://www.npmjs.com/package/protobufjs) パッケージを使用する。

```bash
npm install --save-dev protobufjs
```

これでコードを生成するコマンドが使用可能になる。


[TOP](#top)
<a id="define-proto"></a>
### proto ファイル定義

以下の内容で proto ファイルを定義しておく。

```proto
// hello_world.proto
syntax = "proto3";

package hello_world;

message Hello {
  string world = 1;
  int32 code = 2;
}

message Greet {
  string hello = 1;
  int32 number = 2;
}
```


[TOP](#top)
<a id="generate-code"></a>
### コード生成

以下のコードで js ファイルを生成できる。

```bash
pbjs -t static-module -w es6 -o hello_pb.js hello_world.proto
```

このコマンドには proto ファイルは複数指定できる。
いくつも proto ファイルがある場合は1つにまとめることもできるし、そうしなくてもいい。

さらに、TypeScript 用の型定義ファイルを以下のように生成できる。

```bash
pbts -o hello_pb.d.ts hello_pb.js
```


[TOP](#top)
<a id="encode"></a>
### エンコード

データのエンコードは以下の通り。

```typescript
import { hello_world } from "hello_pb.js";

const hello = new hello_world.Hello();
hello.world = "protobufjs";
hello.code = 1;
const data = hello_world.Hello.encode(hello).finish();
console.log(btoa(String.fromCharCode.apply(null, Array.from(data))));
```

`finish()` しないと Uint8Array にしてくれない。
Uint8Array から保存用に base64 するため、`String.fromCharCode` でバイト列を文字列にした後 btoa している。

encode メソッドには Plain Javascript Object も指定できる。
しかし、せっかく TypeScript でやっているので型チェックが効くようにメッセージオブジェクトを使用したい。


[TOP](#top)
<a id="decode"></a>
### デコード

データのデコードは以下の通り。

```typescript
import { hello_world } from "hello_pb.js";

const message = "Cgpwcm90b2J1ZmpzEAE="; // 先のエンコードの出力結果
try {
    console.log(hello_world.Hello.decode(Uint8Array.from(atob(message), c => c.charCodeAt(0))));
} catch (err) {
    console.log(`decode error!: ${err}`);
}
```

デコードエラーで例外が出るので try-catch する必要がある。

proto 定義でフィールド名を変えてみても、ちゃんとデコードできる。
感動。

ちなみに先の proto 定義で Hello のほかに Greet というメッセージも定義しておいた。
Hello でエンコードした内容を Greet でデコードしてみると、無事（涙）デコードできる。
どの型でエンコードしてどの型でデコードするのか、そこをちゃんとするのはプログラムを書く人の責任なんだな。


[TOP](#top)
<a id="postscript"></a>
### まとめ

TypeScript で protocol buffers のエンコード・デコード方法をまとめた。
とりあえずこれで Local Storage へ保存するときに protocol buffers を使用できる。


[TOP](#top)
<a id="reference"></a>
### 参考資料

- [protobufjs | npm](https://www.npmjs.com/package/protobufjs)


[TOP](#top)
