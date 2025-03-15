# JavaScript の async/await について
<a id="top"></a>

AWS Lambda の初期コードに async が使われていた。
これがよくわかっていなかったために数時間グダッたのでここに記録しておく。

###### CONTENTS

1. [この記事の内容](#abstruct)
1. [async について](#about-async)
1. [await について](#about-await)
1. [async/await の使い所](#use-async-await)
1. [まとめ](#postscript)
1. [参考資料](#reference)


###### ENVIRONMENTS

- Node.js 10.16.0


<a id="abstruct"></a>
### この記事の内容

ほぼ下記の記事と同じ内容。
これらを読んで自分なりにまとめなおしたもの。

- [async/await 入門（JavaScript） : Qiita](https://qiita.com/soarflat/items/1a9613e023200bbebcb3)
- [async/await地獄 : Qiita](https://qiita.com/rana_kualu/items/e6c5c0e4f60b0d18799d)
- [Async/await : javascript.info](https://javascript.info/async-await)


[TOP](#top)
<a id="about-async"></a>
### async について

`async` キーワードを function の前につけることで、その関数は Promise を返すようになる。

```javascript
const func = async () => {
  return 1;
}
```

これは下記のコードと同様。

```javascript
const func = () => {
  return new Promise((resolve, reject) => {
    resolve(1);
  });
}
```


[TOP](#top)
<a id="about-await"></a>
### await について

Promise を await すると、その Promise の結果が返ってくるまでその場で待つ。

これは async をつけた関数の中でのみ使用可能。

```javascript
const func = async () => {
  const response = await fetch("https://example.com");

  console.log(response.status);

  return response.body.text();
}
```

これは下記のコードと同様。

```javascript
const func = () => {
  return fetch("https://example.com").then((response) => {
    console.log(response.status);

    return response.body.text();
  });
}
```

await をいくつか続けて書くこともできる。

```javascript
const func = async () => {
  const first = await fetch("https://example.com/first");
  console.log(first.status);

  const second = await fetch("https://example.com/second");
  console.log(second.status);

  return {
    first,
    second,
  };
}
```

この場合、実行は直列化される。

```javascript
const func = () => {
  return fetch("https://example.com/first").then((first) => {
    console.log(first.status);

    return fetch("https://example.com/second").then((second) => {
      console.log(second.status);

      return {
        first,
        second,
      };
    });
  });
}
```


[TOP](#top)
<a id="use-async-await"></a>
### async/await の使い所

async/await について、以下のように感じた。

- async は関数内で await を使いたいときに使用する
- await はかなり便利

しかし、[async/await地獄 : Qiita](https://qiita.com/rana_kualu/items/e6c5c0e4f60b0d18799d) では、await はうまく使わないと効率がよくないと書いてある。

特に、await を続けて書く場合は注意が必要であるように感じた。
無駄に直列化させないために、`Promise.all` を使用することを検討したい。

```javascript
const func = async () => {
  const result = await Promise.all([
    fetch("https://example.com/first"),
    fetch("https://example.com/second"),
  ]);

  console.log(result[0].status); // first
  console.log(result[1].status); // second

  return {
    first: result[0],
    second: result[1],
  };
}
```


[TOP](#top)
<a id="postscript"></a>
### まとめ

AWS Lambda で、Slack Bot をやろうと思ってコードを書き始めた。
イベントの内容によって fetch する、という簡単な内容だったのでテストもそこそこにデプロイしつつデバックしていた。
デプロイするのに時間がかかる上、 async/await も理解していなかったおかげで、なんで動かないのか気づくのに数時間かかってしまった。
時間がかかるので、隣のディスプレイでアニメを流しながら作業していたこともあって相当グダグダやっていた。

結局、fetch の結果を待たずに処理を終えていることが原因だった。
（async/await 関係ないね）

テストを十分揃えてからデプロイするようにしよう、と心に硬く誓うのであった。


[TOP](#top)
<a id="reference"></a>
### 参考資料

- [async/await 入門（JavaScript） : Qiita](https://qiita.com/soarflat/items/1a9613e023200bbebcb3)
- [async/await地獄 : Qiita](https://qiita.com/rana_kualu/items/e6c5c0e4f60b0d18799d)
- [Async/await : javascript.info](https://javascript.info/async-await)


[TOP](#top)
