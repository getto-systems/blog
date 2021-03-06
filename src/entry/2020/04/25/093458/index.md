# Windows10 で Ubuntu 20.04 にする話
<a id="top"></a>

Ubuntu 18.04 がインストールされていて、これを 20.04 にアップグレードしたい。

###### CONTENTS

1. [方針](#abstract)
1. [バックアップ](#backup)
1. [アンインストール・新規インストール](#re-install)
1. [リストア](#restore)
1. [まとめ](#postscript)


###### ENVIRONMENTS

- Windows10
- Ubuntu 18.04 -> 20.04


<a id="abstract"></a>
### 方針

デフォルトのパッケージ以外はインストールしていないので、いったんアンインストールしてしまうことにする。

とりあえず Windows のアプリストアから Ubuntu を更新してみたが、20.04 になったりはしなかった。（そりゃそうか案件）
なので Ubuntu のツールでアップグレードする必要があるのだが、これが結構面倒。

これが面倒なので、クリーンインストールしやすいようにパッケージのインストールを最小限にとどめていた。


[TOP](#top)
<a id="backup"></a>
### バックアップ

Ubuntu のアンインストールをする前に、必要なファイルのバックアップを取っておく。

特に、ssh のプライベートキーはバックアップしておかないと開発環境にログインできなくなる。
あとは .bashrc の apt update するコード。

このくらいで済むように WSL 上では何もコードを書かないようにしていた。


[TOP](#top)
<a id="re-install"></a>
### アンインストール・新規インストール

Ubuntu のアンインストールは、スタートメニューの Ubuntu を右クリックして「アンインストール」を選択する。
特にダイアログとか表示されることなく、すっとアンインストールされてしまう。
アンインストールをクリックする前にバックアップがちゃんと取れているか確認しておくこと。

アンインストールしたらアプリストアから Ubuntu を再度インストールする、のだが、この時インストールエラーになってしまった。
何が原因かわからないが、マシンをいったん再起動したらインストールできた。


[TOP](#top)
<a id="restore"></a>
### リストア

最初にとっておいたバックアップをリストアする。
ssh のキーと、bashrc に仕込む apt update のコードだ。


[TOP](#top)
<a id="postscript"></a>
### まとめ

実は特にバックアップ取ることなくアンインストールしてしまって開発環境にログインできなくなった。
バックアップ大事。


[TOP](#top)
