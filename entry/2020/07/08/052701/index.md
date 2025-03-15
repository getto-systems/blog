# preact と htm でフロントエンド
<a id="top"></a>

###### CONTENTS

1. [なぜそうするのか](#purpose)
1. [開発環境の構築](#setup-development)
1. [サンプルコード](#sample)
1. [まとめ](#postscript)
1. [参考資料](#reference)


###### ENVIRONMENTS

- preact : 10.4.4
- htm : 3.0.4
- typescript : 3.9.5
- webpack : 4.43.0


<a id="purpose"></a>
### なぜそうするのか

[この記事](https://mizchi.dev/202006261728-minimal-js)を読んで、[preact](https://preactjs.com/) というものがあることを知った。
軽量だというので使用してみたい。
[htm](https://github.com/developit/htm) を使用すれば単純な関数を組み合わせて React 的なコードが書ける。

[前の記事](/entry/2020/06/15/231936)で Vue を試してみたのだが、リリースしてみたら CSP 違反が発覚。
unsafe-eval を有効にしないと動かなかった。
おそらく vue ファイルを読み込むために eval しているのだと推測している。
vue ファイルの形式ではなく、文字列で html のテンプレートを書けば eval は含まれなくなるはず。
詳しく調べていないので推測でしかない。

とにかく [preact](https://preactjs.com/) を使ってみたかった、というのが主な動機だ。
Hook を使用すれば単純な関数で記述できる。
なかなかいい感じだ。


[TOP](#top)
<a id="setup-development"></a>
### 開発環境の構築

以下のパッケージをインストールする。
バージョンは 2020/07/08 現在のもの。

```json
"devDependencies": {
  "htm": "^3.0.4",
  "preact": "^10.4.4",
  "typescript": "^3.9.5",
  "webpack": "^4.43.0",
  "webpack-cli": "^3.3.11",
  "webpack-dev-server": "^3.11.0"
}
```

webpack.config.js は以下のようにセットアップする。

```javascript
const fs = require("fs");
const path = require("path");

module.exports = {
  entry: {
    index: path.join(__dirname, "src/index.ts"),
  },
  output: {
    path: path.join(__dirname, "dist"),
    filename: "[name].js",
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: "ts-loader",
      },
    ],
  },
  devServer: devServer(),
};

function devServer() {
  if (!process.env.WEBPACK_DEV_SERVER) {
    return {};
  }

  return {
    contentBase: path.join(__dirname, "public"),
    publicPath: "/dist/",

    host: "0.0.0.0",
    port: process.env.PUBLIC_APP_PORT,
    disableHostCheck: true,

    https: true,
    cert: fs.readFileSync(process.env.TLS_CERT),
    key: fs.readFileSync(process.env.TLS_KEY),

    hot: true,
    sockPort: `${process.env.LABO_PORT_PREFIX}${process.env.PUBLIC_PORT}`,
  };
}
```

devServer は適当に指定する。

tsconfig.js は以下の通り。

```javascript
{
  "compilerOptions": {
    "target": "es2019",
    "module": "esnext",
    "moduleResolution": "node",
    "allowJs": true,
    "strict": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

typescript のビルドのために、空の `main.d.ts` も作成しておく。


[TOP](#top)
<a id="sample"></a>
### サンプルコード

とりあえず以下が最小限のコード。

```typescript
import { h, render } from "preact";

const app = h("main", { class: "main" }, [
  h(Page, null, null),
]);
render(app, document.body);

import { useState } from "preact/hooks";
import { html } from "htm/preact";

type State = {
  message: string,
}

function Page() {
  const [state, setState] = useState<State>({
    message: "Hello, World",
  });

  return html`
    <h1>${state.message}</h1>
  `
}
```

preact の render に必要なコードとコンポーネント定義に必要なコードを分けて書いてみた。
htm を使用することで tsx ではなく typescript で書けるので、普通にコンパイルできる。

htm は空タグには対応していないので注意。
必ず閉じタグを書くか、`/>` で閉じること。


[TOP](#top)
<a id="postscript"></a>
### まとめ

preact と htm で React 的なコンポーネント定義ができるようになった。
普通の typescript で書けるのでこれから typescript を書く身としてはなかなかうれしい。
見た目も単純な関数なのでとっかかりやすい。

Hook の性質をつかむのにちょっと時間がかかりそうだけどこれで行こう。


[TOP](#top)
<a id="reference"></a>
### 参考資料

- [省ビルドサイズ要求環境でモダンフロントエンドをやる (主に preact の話) | mizdev](https://mizchi.dev/202006261728-minimal-js)
- [preact](https://preactjs.com/)
- [developit/htm | GitHub](https://github.com/developit/htm)


[TOP](#top)
