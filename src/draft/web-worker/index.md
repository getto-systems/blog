# webpack で web-worker してみる話
<a id="top"></a>

###### CONTENTS

1. [なぜそんなことをするのか](#purpose)
1. [まず単純に worker してみる](#begin-simple)
1. [webpack で build してみる](#build-webpack)
1. [うまくいかなかったこと](#tried)
1. [まとめ](#postscript)
1. [参考資料](#reference)


<a id="purpose"></a>
### なぜそんなことをするのか

[この記事](https://mizchi.dev/202009061729-minlink-and-minify-tech)を読んで web worker のことを知った。
DOM の描画処理とは別スレッドでメインの処理を行う、というのは Electron でもそんなことを言っていた気がする。

[preact](https://preactjs.com/) で DOM の処理を行い、メインの処理は worker に投げる、という夢を見たので worker してみることにした。


[TOP](#top)
<a id="begin-simple"></a>
### まず単純に worker してみる

[Web Worker のドキュメント](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers)を見ながら、まずは単純な worker を動かしてみる。

まずは worker のコードを用意する。

```javascript
const ctx = self;

setTimeout(() => {
  ctx.postMessage({ message: "hello, world" });
}, 1000);

ctx.addEventListener("message", (event) => {
  console.log(event.data);
});
```

これを `/worker.js` で参照できるパスに置いておく。

次に worker を起動するコードを書いていく。

```javascript
const worker = new Worker("./worker.js");

worker.addEventListener("message", (event) => {
  console.log(event.data);
});

worker.postMessage({ message: "from app" });
```

これを `/app.js` で参照できるパスに置く。

作成したファイルは以下の通り。

- /worker.js
- /app.js : `./worker.js` で worker を参照できる

app.js をロードする html を用意する。

```html
<html>
  <body>
    <script src="/app.js"></script>
  </body>
</html>
```

これでコンソールに以下の内容が出るはず。

```text
{ message: "from app" }
{ message: "hello, world " }
```

これを webpack を使って typescript で書けるようにしていく。


[TOP](#top)
<a id="build-webpack"></a>
### webpack で build してみる

まず、webpack.config.js の `output.globalObject` を設定する。

```javascript
output: {
  globalObject: "self",
}
```

worker のコードではグローバルオブジェクトは `self` で、`window` ではない。
そのため、これを設定しておかないと HMR のコードが動かないため、worker のコードまで到達する前にこける。

entry の設定はこんな感じ。

```javascript
entry: {
  "worker": path.join(__dirname, "lib/worker.ts"),
  "app": path.join(__dirname, "lib/app.ts"),
}
```

これで先ほどと同じ構成になる。

まずは worker のコード。

```typescript
// lib/worker.ts
const ctx: Worker = self as any // eslint-disable-line @typescript-eslint/no-explicit-any

setTimeout(() => {
  ctx.postMessage({ message: "hello, world" })
}, 1000)

ctx.addEventListener("message", (event) => {
  console.log(event.data)
})
```

javascript とほとんど同じだが、worker の api にアクセスするため `ctx` の型情報を追加している。
そのために any を使っているので eslint-disable を書いてある。

次に worker を起動するコード。

```typescript
// lib/app.ts
const worker = new Worker("./worker.js")

worker.addEventListener("message", (event) => {
  console.log(event.data)
})

worker.postMessage({ message: "from app" })
```

これは先ほどの javascript と全く同じだが、typescript で書けるようになっている。

ただし、やり取りするイベントのデータ型は any なので、worker との接続部分はうまいことつなげてあげないと簡単にエラーになる。
worker に `postMessage` したり、worker からのメッセージをハンドリングするところは注意深く組む必要がある。

とりあえずこれで webpack で worker できるようになった。
やっていることは単純で、worker のコードを build して、それを `new Worker()` しているだけ。


[TOP](#top)
<a id="tried"></a>
### うまくいかなかったこと

worker-loader も使ってみたのだけど、README に書いてあるようにやってもうまくいかなかった。
よくわからないまま試行錯誤したので、何かの設定が足りなかったのだろう。

とりあえず単純な形でやり直してみたらうまくいった。


[TOP](#top)
<a id="postscript"></a>
### まとめ

worker が使えるようになったので、これでコンポーネントのメイン部分を worker にできるといいな。


[TOP](#top)
<a id="reference"></a>
### 参考資料

- [minlink - browser/node で使える Worker ラッパー | mizdev](https://mizchi.dev/202009061729-minlink-and-minify-tech)
- [Using Web Workers | MDN web docs](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers)


[TOP](#top)
