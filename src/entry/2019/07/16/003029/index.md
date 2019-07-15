# vim で markdownlint する
<a id="top"></a>

coc に efm-langserver 追加して、markdownlint が効くようにする。

###### CONTENTS

1. [出来上がったもの](#outcome)
1. [efm-langserver をインストールする](#install-efm-langserver)
1. [markdownlint-cli をインストールする](#install-markdownlint-cli)
1. [まとめ](#postscript)
1. [参考資料](#reference)


###### ENVIRONMENTS

- neovim : v0.3.1


<a id="outcome"></a>
### 出来上がったもの

`:CocConfig` の設定例は以下のとおり。

```json
{
  "languageserver": {
    "efm": {
      "command": "/path/to/bin/efm-langserver",
      "args": [],
      "filetypes": ["markdown"]
    }
  }
}
```

`~/.config/efm-langserver/config.yaml` の設定例は以下のとおり。

```yaml
languages:
  markdown:
    lint-command: '/path/to/node_modules/.bin/markdownlint -s'
    lint-stdin: true
    lint-formats:
      - '%f: %l: %m'
```


[TOP](#top)
<a id="install-efm-langserver"></a>
### efm-langserver をインストールする

[coc.nvim wiki : GitHub](https://github.com/neoclide/coc.nvim/wiki/Language-servers#vimerbmarkdown) を参考に、[mattn/efm-langserver](https://github.com/mattn/efm-langserver) をインストールする。

`go get` でインストールできるが、これは `/go/bin` 以下にツールをコンパイルするもののようだ。
コンパイルされたツールは任意のパスに移動できる。
もちろん、`/go/bin` にパスを通してもよい。

ツールをインストールしたら、`:CocConfig` に `efm-langserver` を追加する。

```json
{
  "languageserver": {
    "efm": {
      "command": "/path/to/bin/efm-langserver",
      "args": [],
      "filetypes": ["markdown"]
    }
  }
}
```


[TOP](#top)
<a id="install-markdownlint-cli"></a>
### markdownlint-cli をインストールする

markdown の lint ツールは [igorshubovych/markdownlint-cli](https://github.com/igorshubovych/markdownlint-cli) を使用する。

インストールしたら、`efm-langserver` の設定を `~/.config/efm-langserver/config.yaml` に記述する。

```yaml
languages:
  markdown:
    lint-command: '/path/to/node_modules/.bin/markdownlint -s'
    lint-stdin: true
    lint-formats:
      - '%f: %l: %m'
```

これで markdown の lint が効くようになる。


[TOP](#top)
<a id="postscript"></a>
### まとめ

vim で markdown を書くときの lint を追加した。

ブログを書くために textlint を入れている。
これもなんとかならないものかと思っていたらいつの間にか textlint のエラーも出るようになっていることに気づいた。
何もしてないんだけどなぁ。


[TOP](#top)
<a id="reference"></a>
### 参考資料

- [coc.nvim wiki : GitHub](https://github.com/neoclide/coc.nvim/wiki/Language-servers#vimerbmarkdown)


[TOP](#top)
