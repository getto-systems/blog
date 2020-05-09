# Cargo でプライベート git を参照する
<a id="top"></a>

###### CONTENTS

1. [なぜそんなことをするのか](#purpose)
1. [git credential helper を設定する](#setup-git-credential-helper)
1. [CI 設定](#setup-ci)
1. [まとめ](#postscript)
1. [参考資料](#reference)


###### ENVIRONMENTS

- cargo 1.43.0 (3532cf738 2020-03-17)
- rustc 1.43.0 (4fb7144ed 2020-04-20)


<a id="purpose"></a>
### なぜそんなことをするのか

ドメインロジックをクレートとして開発し、それを web アプリケーションから参照したい。
しかし、ドメインロジックなので crates.io で公開するわけにはいかない。
Cargo には git を参照する機能があるが、プライベートな場合の設定が難航したのでまとめておく。


[TOP](#top)
<a id="setup-git-credential-helper"></a>
### git credential helper を設定する

プライベートな git を Cargo.toml に書くと、git の credential helper を設定してくれと文句を言われる。
今回は CI の設定にも使用できる、store ヘルパーを使用して設定を行う。

store ヘルパーは、最初の認証時に credential をファイルに保存しておく。
認証が必要になったとき、このファイルから credential を読み込んで認証を行うので、credential の入力を省略できる。

store ヘルパーを使用するには `$HOME/.gitconfig` に以下の項目を追加する。
ローカルの `.git/config` では設定を変更できなかった。

```gitconfig
[credential]
  helper = store
```

store ヘルパーが使用するファイルは `$HOME/.git-credentials` だ。
ここに以下の形式で認証情報が記録される。

```txt
https://user:pass@example.com
```

暗号化されるわけではないので扱いには注意が必要。


[TOP](#top)
<a id="setup-ci"></a>
### CI 設定

CI では、`cargo` コマンドを走らせる前に以下のセットアップを行うことで、プライベート git を参照できるようにしておく。

```bash
git config --global credential.helper store
echo "https://$USER:$PASS@github.com" > $HOME/.git-credentials
```

これは github にホストしてある場合の例。
各開発者のユーザー名、パーソナルアクセストークンを使用すればよい。


[TOP](#top)
<a id="postscript"></a>
### まとめ

Cargo でプライベート git を参照する方法をまとめた。

[ドキュメント](https://git-scm.com/docs/gitcredentials)では、プライベート git にアクセスする方法として `GIT_ASKPASS` を使用する方法も紹介されていた。
しかし、`cargo` コマンドは環境変数をうまく渡してくれないようで、この方法ではうまくいかなかった。

ともあれ、これでバージョン管理は Cargo.toml で完結させつつ、ドメインロジックを別クレートで開発する準備が整った。


[TOP](#top)
<a id="reference"></a>
### 参考資料

- [git credentials | Git Docs](https://git-scm.com/docs/gitcredentials)
- [git credential store | Git Docs](https://git-scm.com/docs/git-credential-store)


[TOP](#top)
