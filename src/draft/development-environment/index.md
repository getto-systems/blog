# うちの開発環境 - 2019版
<a id="top"></a>

現在の開発環境と、構築方法をまとめる。

###### CONTENTS

1. [INTEL NUC](#intel-nuc)
1. [CoreOS](#coreos)
1. [labo-container](#labo-container)
1. [dotfiles](#dotfiles)
1. [docker-wrapper](#docker-wrapper)
1. [まとめ](#postscript)
1. [参考資料](#reference)


<a id="intel-nuc"></a>
### INTEL NUC

[INTEL NUC](https://www.intel.com/content/www/us/en/products/boards-kits/nuc.html) に CoreOS をインストールした。
Wi-Fi 内蔵なのに CoreOS で使用できないのはもったいない気もする。

スペックとかは失念した。
探すのも面倒なので、新しくするときはそのとき良さそうなやつを選ぶ。

完全に個人用で、チームで共有とかはしない。


[TOP](#top)
<a id="coreos"></a>
### CoreOS

[CoreOS](https://coreos.com/) をインストールして Docker をベースにした開発環境を整える。
Wi-Fi を使えるようにはなっていないので、有線で接続する必要がある。

- CoreOS で Wi-Fi が使えないか調べていたら、「え、なんで」的なやりとりを見つけた
- まあ、そうなるな

インストール方法もどこかに行ってしまった。
USB でインストールしたはず。
これも新しくするときに良さそうな方法を選ぼう。

ユーザーは適宜作成して、core ユーザーは常用しない。
このユーザーには docker グループをつけて、docker コマンドを使用できるようにしておく。


[TOP](#top)
<a id="labo-container"></a>
### labo-container

[labo-container-connect](https://github.com/getto-systems/labo-container-connect) を使用してコンテナを起動する。

```bash
INTERFACE_NAME=eno1 /path/to/labo-container-connect/bin/connect
```

`INTERFACE_NAME` には、NIC のインターフェイス名を指定する。
このインターフェイス名からローカルIP アドレスを取得してコンテナに渡している。

起動するイメージは [labo-container](https://cloud.docker.com/u/getto/repository/docker/getto/labo-container)。
nvim、python、node が入っている。

volume は `/docker-volumes/apps:/apps`、`/docker-volumes/home:/home`、`/tmp/labo-connect/$user` をマウントする。
`/docker-volumes` をバックアップすること。

#### volume のバックアップ

Mac に以下の Launch Agent を記述してバックアップを行う。
ファイルは `~/Library/LaunchAgents/systems.getto.backup-coreos.plist` に保存した。

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>systems.getto.coreos-backup</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/rsync</string>
        <string>-av</string>
        <string>--delete</string>
        <string>USER@HOST:/docker-volumes/</string>
        <string>/Users/USER/Works/volumes</string>
    </array>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>18</integer>
        <key>Minute</key>
        <integer>20</integer>
    </dict>
    <key>StandardErrorPath</key>
    <string>/Users/USER/Works/logs/coreos-backup.stderr.log</string>
</dict>
</plist><Paste>
```

USER、HOST、バックアップパスは適宜書き換える必要がある。

以下のコマンドで有効にする。

```bash
launchctl unload ~/Library/LaunchAgents/systems.getto.backup-coreos.plist
launchctl load ~/Library/LaunchAgents/systems.getto.backup-coreos.plist
```

load 済みの場合はまず unload する必要がある。

これで定期的に Mac に rsync される。
これを TimeMachine でバックアップしておけばさらに安心。


[TOP](#top)
<a id="dotfiles"></a>
### dotfiles

dotfiles は [config-files : GitHub](https://github.com/shun-fix9/config-files) にまとめてある。

これを `~/.config` にチェックアウトすれば良いかというとそれだけではなく home ディレクトリを復元する必要がある。
これは上記バックアップから復元するしか方法はない。


[TOP](#top)
<a id="docker-wrapper"></a>
### docker-wrapper

実行環境は docker image に閉じ込めて docker run で起動する。

これを [docker-wrapper](https://github.com/getto-systems/docker-wrapper) で普通のコマンドと同じ要領で実行できるようにする。
コマンドは [docker-wrapper-commands](https://github.com/getto-systems/docker-wrapper-commands) にまとめてある。

これらをチェックアウトして PATH を通しておく。


[TOP](#top)
<a id="postscript"></a>
### まとめ

2019年現在の開発環境の構築方法をまとめた。

とにかく volume のバックアップが肝。
なのにバックアップの確認はおろそかになっていて、今回も確認している途中でバックアップができていないことに気づいた。
季節ごとくらいの頻度で見直すべきか。


[TOP](#top)
<a id="reference"></a>
### 参考資料

- [INTEL NUC](https://www.intel.com/content/www/us/en/products/boards-kits/nuc.html)
- [CoreOS](https://coreos.com/)


[TOP](#top)
