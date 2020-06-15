# Vue 3 を TypeScript で
<a id="top"></a>

###### CONTENTS

1. [なにがやりたいのか](#purpose)
1. [必要なパッケージのインストール](#install-packages)
1. [webpack のセットアップ](#setup-webpack)
1. [vue を使うための TypeScript の設定をする](#setup-vue)
1. [vue コードを書く](#write-vue)
1. [まとめ](#postscript)
1. [参考資料](#reference)


###### ENVIRONMENTS

- node : 14.4.0
- vue : 3.0.0-beta.15


<a id="purpose"></a>
### なにがやりたいのか

HTML の描画とイベントハンドリングがしたい。
とりあえずやりたいのはこれだけなので、Vue にした。
Vue 3 は現時点ではまだ beta だけど、Vue 2 で TypeScript を書くためにはいろいろめんどくさかった。

TypeScript を選択したのは、テンプレートで使用可能な変数がコードでドキュメント化されるから。

bundler は webpack を使用する。
[vitejs](https://github.com/vitejs/vite) も気になっているが、いろいろやってくれる分、サポートされていないことをやる時はトラブルシューティングがつらくなると判断した。
[snowpack](https://www.snowpack.dev/) も気になっているが、デプロイするときには結局 webpack を使う感じのことが書いてあるので、今は webpack で行くことにした。


[TOP](#top)
<a id="install-packages"></a>
### 必要なパッケージのインストール

以下、ほぼ[この記事](https://dev.to/lmillucci/building-a-vue-3-component-with-typescript-4pge)の通りに進めていく。

以下のパッケージをインストールする。
バージョンは 2020/06/15 現在のもの。

```json
"devDependencies": {
  "@vue/compiler-sfc": "^3.0.0-beta.15",
  "ts-loader": "^7.0.5",
  "typescript": "^3.9.5",
  "vue": "^3.0.0-beta.15",
  "vue-loader": "^16.0.0-beta.3",
  "webpack": "^4.43.0",
  "webpack-cli": "^3.3.11",
  "webpack-dev-server": "^3.11.0"
}
```


[TOP](#top)
<a id="setup-webpack"></a>
### webpack のセットアップ

以下の通り `webpack.config.js` を作成する。

```javascript
const fs = require("fs");
const path = require("path");
const { VueLoaderPlugin } = require("vue-loader");

module.exports = {
  entry: () => {
    const entry = {};

    entry["index"] = path.join(__dirname, `src/index.ts`);

    return entry;
  },
  output: {
    path: path.join(__dirname, "dist"),
    filename: "[name].js",
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: "vue-loader",
      },
      {
        test: /\.ts$/,
        loader: "ts-loader",
        options: {
          appendTsSuffixTo: [/\.vue$/],
        },
      },
    ],
  },
  resolve: {
    alias: {
      'vue': '@vue/runtime-dom',
    }
  },
  plugins: [
    new VueLoaderPlugin(),
  ],
  devServer: devServer(),
};

function devServer() {
  if (!process.env.WEBPACK_DEV_SERVER) {
    return {};
  }

  return {
    contentBase: path.join(__dirname),
    publicPath: "/dist/",

    host: "0.0.0.0",
    port: process.env.APP_PORT,
    sockPort: process.env.SOCK_PORT,
    disableHostCheck: true,

    https: true,
    cert: fs.readFileSync(process.env.TLS_CERT),
    key: fs.readFileSync(process.env.TLS_KEY),

    hot: true,
  };
}
```

`ts-loader` の `appendTsSuffixTo` についてはよくわかっていない。
Vue を使うときの設定、くらいの理解。

`resolve.alias` についてもよくわかっていない。
これがないと Vue の `createApp` に `template` を指定するとエラーになる。

`devServer` については適当に指定する。
ここでは https のオプションを指定しているので、本番用 build でエラーにならないよう関数で定義している。


[TOP](#top)
<a id="setup-vue"></a>
### vue を使うための TypeScript の設定をする

以下の内容で `tsconfig.json` を作成する。
[この記事](https://mizchi.hatenablog.com/entry/2020/05/03/151022)を参考にした。

```json
{
  "compilerOptions": {
    "target": "es2019",
    "module": "esnext",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

また、`tsconfig.json` と同じディレクトリに `shims-vue.d.ts` を以下の内容で作成する。

```typescript
declare module "*.vue" {
  import { defineComponent } from "vue";
  const Component: ReturnType<typeof defineComponent>;
  export default Component;
}
```

type 定義用ディレクトリを用意している場合はそこに作成すればいい。


[TOP](#top)
<a id="write-vue"></a>
### vue コードを書く

先に作成した `webpack.config.js` で `src/index.ts` をエントリーにした。
なので、以下の内容で `src/index.ts` を作成する。
ここがエントリーポイントになる。

```typescript
import { createApp } from 'vue';
import Main from "./main.vue";

createApp({
  components: {
    Main,
  },
  template: "<Main/>",
}).mount('#main');
```

この例ではコンポーネントが１つしかないので、以下のようにも書ける。

```typescript
import { createApp } from 'vue';
import Main from "./main.vue";

createApp(Main).mount('#main');
```

次に、`src/index.ts` から呼ばれる `src/main.vue` を作成する。

```vue
<template>

<article>
  <h1>{{ state.data.message }}</h1>
  <ul v-if="state.data.items">
    <li v-for="item in state.data.items"><a href="#" @click.prevent="clicked(item)">{{ item.label }}</a></li>
  </ul>
</article>

</template>

<script lang="ts">
import { reactive } from "vue";

type State = {
  data: Data,
};

type Data = {
  message: string,
  items: Array<Item>,
};

type Item = {
  label: string,
};

export default {
  setup() {
    const state = reactive<State>({
      data: {
        message: "Hello, Vue!",
        items: [
          { label: "item1" },
          { label: "item2" },
          { label: "item3" },
        ],
      },
    });

    const clicked = (item: Item) => {
      console.log(item);
    };

    return {
      state,
      clicked,
    };
  }
};
</script>

<style>
</style>
```

`setup()` で返している `state` は `reactive()` を使用して構築している。
これについては [Composition API RFC](https://vue-composition-api-rfc.netlify.app/) に詳しく書いてある。

とりあえず、`setup()` で返すオブジェクトはすべて `reactive()` を通す、という理解でいい。
プリミティブな値であれば `ref()` を使用する。

これを動かすと、`Hello, Vue!` と、`item` のリストが表示されるはず。
また、`item` のリストをクリックするとコンソールに `item` の内容が出る。


[TOP](#top)
<a id="postscript"></a>
### まとめ

Vue 3 を TypeScript で書く方法をまとめた。

最初は Vue 2 で TypeScript を書くやり方を調べていたのだけれど、Vue 3 で書いてみたらすっとかけたので beta だけどこっちで行くことにした。


[TOP](#top)
<a id="reference"></a>
### 参考資料

- [vitejs/vite | GitHub](https://github.com/vitejs/vite)
- [snowpack](https://www.snowpack.dev/)
- [Building a Vue 3 component with Typescript | dev.to](https://dev.to/lmillucci/building-a-vue-3-component-with-typescript-4pge)
- [俺の webpack.config.js-20200503 | mizchi's blog](https://mizchi.hatenablog.com/entry/2020/05/03/151022)
- [Composition API RFC | Vue Composition API](https://vue-composition-api-rfc.netlify.app/)


[TOP](#top)
