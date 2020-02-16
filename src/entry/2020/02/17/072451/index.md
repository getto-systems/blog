# うちの開発環境 - 2020版
<a id="top"></a>

現在の開発環境と、構築方法をまとめる。

###### CONTENTS

1. [INTEL NUC](#intel-nuc)
1. [Debian](#debian)
1. [秘伝のタレと化したバックアップのリストア](#restore-backup)
1. [まとめ](#postscript)
1. [参考資料](#reference)


<a id="intel-nuc"></a>
### INTEL NUC

[INTEL NUC](https://www.intel.com/content/www/us/en/products/boards-kits/nuc.html) に Debian をインストールした。
このマシンは[以前](/entry/2019/09/14/230516)と同じもの。

Debian なので Wi-Fi を使えるはずだが、めんどくさいのでセットアップはしていない。

CoreOS のサポートがなくなるので Debian を選択した。
Ubuntu じゃないのはそんなに頻繁に OS を入れ替えたくないから。
LTS な Ubuntu なら頻度は同じだけど、まあ気分で Debian にした。

- Ubuntu はダウンロードが遅かった（ミラーを使えばよかったのかも）


[TOP](#top)
<a id="debian"></a>
### Debian

[Debian Live インストールイメージ](https://www.debian.org/CD/live/)のページから iso をダウンロードする。
これを USB にコピーしてインストールする。

- netinst のイメージを使ったら CD が見つからないって言われて進まなかった

インストールは最小限のインストールで問題ない。
パッケージは以下のものをインストールした。

```bash
sudo apt-get update
sudo apt-get upgrade
sudo apt install ssh curl
curl -sSL https://get.docker.com | sh
```

ssh サーバーと docker だけで問題ない。
普段使いのユーザーに `docker` グループを追加しておく。

また、以下の内容で unit ファイルを `/etc/systemd/system/mnt-backup.mount` に作成してバックアップディスクをマウントしておく。

```unit
[Unit]
Description=Mount Backup USB HDD
Before=local-fs.target

[Mount]
What=/dev/disk/by-uuid/$UUID
Where=/mnt/backup
Type=ext4
Options=defaults

[Install]
WantedBy=local-fs.target
```

`$UUID` は実際の UUID にする。
外付け USB ディスクを抜き差しすることであたりがつくはず。

以下のコマンドでマウントできるか確認する。

```bash
sudo systemctl daemon-reload
sudo systemctl start mnt-backup.mount
```

とりあえず reboot してうまくいっているか確認しておこう。


[TOP](#top)
<a id="restore-backup"></a>
### 秘伝のタレと化したバックアップのリストア

すでに秘伝のタレと化したバックアップをリストアする。

なくなったら大変だよね。
S3 とかにコピーしておいたほうがいいかな。


[TOP](#top)
<a id="postscript"></a>
### まとめ

2020年現在の開発環境の構築方法をまとめた。

前までは CoreOS だったので OS の更新は自動でやってくれたが、これからは手動でやらなければならない。
このため、リリース日が近くなったら警告メッセージを表示するようにした。
また、ログインするたびに `apt-get upgrade` するようにもした。

まあ、インターネットに公開するものではないので適当ではある。


[TOP](#top)
<a id="reference"></a>
### 参考資料

- [Live インストールイメージ | Debian Wiki](https://www.debian.org/CD/live/)


[TOP](#top)
