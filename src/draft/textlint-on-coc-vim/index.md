# coc.vim で textlint する話
<a id="top"></a>

- coc.vim で efm-langserver を利用して textlint をかけるようにセットアップしてみる

###### CONTENTS

1. [出来上がったもの](#outcomes)
1. [coc.vim の設定](#setup-coc-vim)
1. [efm-langserver の設定](#setup-efm-langserver)
1. [textlint の設定](#setup-textlint)
1. [まとめ](#postscript)
1. [参考資料](#reference)


<a id="outcomes"></a>
### 出来上がったもの

- coc.vim -> efm-langserver -> textlint

coc.vim の設定 `:CocConfig` は以下の通り。

```json
{
  "languageserver": {
    "efm": {
      "command": "efm-langserver",
      "args": [],
      "filetypes": ["markdown"]
    }
  }
}
```

efm-langserver の設定 `$HOME/.config/efm-langserver/config.yaml` は以下の通り。

```yaml
languages:
  markdown:
    lint-command: 'npx textlint --format unix ${INPUT}'
    lint-formats:
      - '%f:%l:%n: %m'
```

textlint の設定 `.textlintrc` は以下の通り。

```json
{
  "rules": {
    "preset-ja-technical-writing": true
  }
}
```


[TOP](#top)
<a id="setup-coc-vim"></a>
### coc.vim の設定

[coc.vim](https://github.com/neoclide/coc.nvim) の設定 `:CocConfig` は以下の通り。

```json
{
  "languageserver": {
    "efm": {
      "command": "efm-langserver",
      "args": [],
      "filetypes": ["markdown"]
    }
  }
}
```

markdown に対して `efm-langserver` が起動するように設定する。

トラブルシューティングには、`:CocInfo` で簡単なログを見ることができる。


[TOP](#top)
<a id="setup-efm-langserver"></a>
### efm-langserver の設定

`$HOME/.config/efm-langserver/config.yaml` に [efm-langserver](https://github.com/mattn/efm-langserver) の設定を設置する。

```yaml
languages:
  markdown:
    lint-command: 'npx textlint --format unix ${INPUT}'
    lint-formats:
      - '%f:%l:%n: %m'
```

lint-command で設定したコマンドが実行される。

`${INPUT}` がファイル名に置換するためのプレースホルダ。
[README](https://github.com/mattn/efm-langserver#example-for-configyaml) には標準入力を受け付ける例しか書いていないが、ファイル名を指定するにはこうする。

標準入力を指定するとバッファに対して lint してくれるような気もするが、textlint ではうまくいかなかった。

lint-formats には、vim の errorformat の制御文字列を記述する。
lint-command の出力がこのパターンにマッチする場合は diagnostics が追加される。

なお、この設定では `%f:%l:%n: %m` としている。
これは以下の意味を持つ。

- `%f` : ファイル名
- `%l` : 行番号
- `%n` : 本来この部分は column `%c` だが、単なる数値にマッチする `%n` でこれを無視する
- `%m` : メッセージ

`%n` の部分を `%c` としたら、エラーメッセージがそのカラムにカーソルがないと非表示になってしまった。
vim の画面にどのカラムがエラーか表示されないので、これでは不便。
このため column のデータを無視することにした。


[TOP](#top)
<a id="setup-textlint"></a>
### textlint の設定

textlint はローカルにインストールする。

`.textlintrc` は以下を設定する。

```json
{
  "rules": {
    "preset-ja-technical-writing": true
  }
}
```

ここではルールセットとして `textlint-rule-preset-ja-technical-writing` をインストールしているので、これを有効化している。


[TOP](#top)
<a id="postscript"></a>
### まとめ

coc.vim で efm-langserver を利用して textlint するために必要な設定をまとめた。

以前は markdownlint を入れたらなんか textlint までしてくれるようになったのだが、これが突然効かなくなったのでちゃんと設定した。


[TOP](#top)
<a id="reference"></a>
### 参考資料

- [mattn/efm-langserver | GitHub](https://github.com/mattn/efm-langserver)
- [textlint/textlint | GitHub](https://github.com/textlint/textlint)
- [reviewdog/errorformat | GitHub](https://github.com/reviewdog/errorformat)


[TOP](#top)
