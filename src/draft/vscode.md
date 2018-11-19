# VSCode でリモートサーバーのソースを編集する
<a id="top"></a>

これまで vim で開発を行ってきたが、 VSCode が良いというのを聞いて使ってみたくなった。
ただし、 Mac にインストールするものは最小限にしたい。

![VSCode -> CoreOS](https://resources-live.sketch.cloud/files/d4d38384-0df4-43ec-b459-eac720bc3597.png?Expires=1542762000&Signature=BHZBnM2mWYzdVBD5d1BF1JX5Vge5ascogE52vMDo5GUwdZYX~A-qlfbm4N0cZz8y2HyBqjFmHlDT1YwhFFASMjw9IF2I9MB-zU6URXJVqUNp9i6DfV~Y9W0QZsRPA4cUECyQKO7l7pFHilkoh-G79IPLlk1wNMRLt~rJ8KGzSNw_&Key-Pair-Id=APKAJOITMW3RWOLNNPYA)


###### CONTENTS

1. [VSCode のインストール](#install-vscode)
1. [SFTP Config](#setup-sftp-config)
1. [VSCode Config](#setup-vscode-config)
1. [GitHub flow の運用](#github-flow)
1. [まとめ](#postscript)
1. [参考資料](#reference)


[TOP](#top)
<a id="install-vscode"></a>
### VSCode のインストール

VSCode は適当にインストールする。

今回の構成では以下の Extension は必須。

- SFTP : リモートにソースをコピーするのに、 SFTP を使う
- Vim : Vim も入れて操作感をこれまでと合わせたい

Recommended と言われたので GitLens も入れた。
最終更新を表示してくれるのでなかなか良い感じ。


[TOP](#top)
<a id="setup-sftp-config"></a>
### SFTP Config

SFTP Config で設定を追加する。

```json
{
    "protocol": "sftp",
    "host": "REMOTE_HOST",
    "port": 22,
    "username": "USER",
    "remotePath": "/path/to/app",
    "privateKeyPath": "/path/to/.ssh/id_rsa",
    "ignore": [
        ".vscode",
        ".git",
        ".DS_Store"
    ],
    "syncMode": "full",
    "uploadOnSave": true,
    "watcher": {
        "files": "**/*",
        "autoUpload": false,
        "autoDelete": false
    }
}
```

詳しい説明は Readme を読むとして、ハマったところを書いておく。

watcher.autoUpload を true にすると、 `git pull` とかで更新されたファイルが一斉にアップロードされる。
サーバーでファイルを watch してコンパイルしている部分で大変なことになった。


[TOP](#top)
<a id="setup-vscode-config"></a>
### VSCode Config

settings.json を載せておく。

```json
{
  "workbench.colorTheme": "Solarized Light",
  "editor.fontFamily": "'APJapanesefontT', Menlo, Monaco, 'Courier New', monospace",
  "editor.fontSize": 16,
  "editor.lineHeight": 16,
  "explorer.confirmDelete": false,
  "editor.minimap.enabled": true,
  "elm.makeCommand": null,
  "vim.leader": "<space>",
  "vim.normalModeKeyBindingsNonRecursive": [
    {
        "before": ["<leader>","s"],
        "commands": ["workbench.action.files.save"]
    },
    {
        "before": ["<leader>","w"],
        "commands": ["workbench.action.closeActiveEditor"]
    },
    {
        "before": ["<leader>","q"],
        "commands": ["workbench.action.closeFolder"]
    },
    {
        "before": ["u"],
        "commands": ["undo"]
    },
    {
        "before": [";"],
        "commands": ["workbench.action.showCommands"]
    },
    {
        "before": ["<leader>","n"],
        "commands": ["workbench.action.nextEditor"]
    },
    {
        "before": ["<leader>","h"],
        "commands": ["workbench.action.previousEditor"]
    },
    {
        "before": ["<leader>","t"],
        "commands": ["workbench.action.terminal.new"]
    },
    {
        "before": ["<leader>","a"],
        "commands": ["git.stageAll"]
    },
    {
        "before": ["<leader>","c"],
        "commands": ["git.commitStaged"]
    },
    {
        "before": ["<leader>","b"],
        "commands": ["git.branch"]
    },
    {
        "before": ["<leader>","j"],
        "commands": ["git.checkout"]
    },
    {
        "before": ["<leader>","f"],
        "commands": ["git.pull"]
    },
    {
        "before": ["<leader>","d"],
        "commands": ["git.deleteBranch"]
    },
    {
        "before": ["<leader>","p"],
        "commands": ["git.push"]
    },
    {
        "before": ["<leader>","u"],
        "commands": [
            "git.checkout",
            "git.pull",
            "git.deleteBranch"
        ]
    }
  ]
}
```

vim の設定でマクロ的なことができるので、これで色々やってみよう。

あと、 Vim の Undo がすごく Undo するので、この設定で `Cmd + Z` にしてある。
こうすると `Ctrl + R` で元に戻らなくなるので、ショートカットの設定も追加してある。


[TOP](#top)
<a id="github-flow"></a>
### GitHub flow の運用

VSCode から `git commit`, `git.push` などを行う。

しかし、ローカルで変更したファイルをリモートにコピーするので、リモートの git は当然 modified な状態になる。
このため、 git を同期する方法を用意しておく。

```bash
$ git checkout -b <branch>
$ git add -A .
$ git fetch pub
$ git merge pub/<branch>
$ git reset
```

これでリモートに push したブランチを同期できる。

pull request を投げるスクリプトを用意してあるのだが、 Mac にデプロイしたくないので、リモートで作業する。
pull request をマージしたら、 pub/master に push しておく。

VSCode では、 `git.checkout`, `git.pull`, `git.deleteBranch` することでブランチを削除する。


[TOP](#top)
<a id="postscript"></a>
### まとめ

ローカルとリモートで git の管理をしなければならないので面倒になるが、これで VSCode を使用できる準備が整った。

VSCode の力を最大限発揮するには Mac に実行環境をインストールするべきなのだろうが今回は見送る。
これらしばらく経過観察してみよう。


[TOP](#top)
<a id="reference"></a>
### 参考資料

- [GitHub : VSCodeVim/Vim](https://github.com/VSCodeVim/Vim)
- [GitHub : liximomo/vscode-sftp](https://github.com/liximomo/vscode-sftp)


[TOP](#top)
