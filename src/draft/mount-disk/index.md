# systemd で外付けディスクをマウントする話
<a id="top"></a>

CoreOS な開発環境で外付け USB ディスクにバックアップする方法を調べた。

###### CONTENTS

1. [ディスクの認識](#recognise-disk)
1. [ディスクの初期化](#format-disk)
1. [Unit ファイルの作成](#create-unit-file)
1. [rsync でバックアップ](#backup-rsync)
1. [まとめ](#postscript)
1. [参考資料](#reference)


<a id="recognise-disk"></a>
### ディスクの認識

外付けディスクはほぼ問題なく認識された。
ディスクが認識されていることを確認する方法がわからなかったため、途中再起動はした。

とりあえず `/dev/sdb` として認識されていることを確認した。
この確認を誤ると初期化してはいけないディスクを初期化してしまうので注意。


[TOP](#top)
<a id="format-disk"></a>
### ディスクの初期化

[【ゼロから解説】Linuxのフォーマットの方法](https://eng-entrance.com/linux-format)を参考にしてディスクの初期化を行う。

`/dev/sdb` を、`ext4` で初期化するコマンドが以下。
間違いなく対象のディスクであることを確認しておくこと。

```bash
mkfs -t ext4 /dev/sdb
```

出力を取っておくのを忘れたが、ここで出てくる `Filesystem UUID` をメモしておく。


[TOP](#top)
<a id="create-unit-file"></a>
### Unit ファイルの作成

[Mounting Partitions Using Systemd](https://oguya.ch/posts/2015-09-01-systemd-mount-partition/) を参考にして Unit ファイルを作成する。

この [StackExchange](https://unix.stackexchange.com/questions/283442/systemd-mount-fails-where-setting-doesnt-match-unit-name) によると、ファイル名は mount するパスと一致させる必要がある。
ここでは `/mnt/backup` に mount するので、`/etc/systemd/system/mnt-backup.mount` とした。

以下が Unit ファイルの内容。
`$UUID` は先にメモした `Filesystem UUID` とする。

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

`systemctl` で `start` して動作確認を行う。

```bash
systemctl daemon-reload
systemctl start mnt-backup.mount
```

何かエラーが出たら `systemctl` で `status` 確認しなさい、的なメッセージが出るはずなのでそれでトラブルシューティングする。

問題なければ `systemctl` で `enable` してからリブートしてみる。
起動後、ディスクがちゃんと mount されていれば OK。

[TOP](#top)
<a id="backup-rsync"></a>
### rsync でバックアップ

以下のコマンドでバックアップしている。

```bash
rsync -aq --delete /docker-volumes/ /mnt/backup/volumes
```

`/docker-volumes` に共有する volume をすべて入れてある。

`/var/lib/docker` のバックアップでも良いのだが、これは通常の権限ではできないのでやめた。


[TOP](#top)
<a id="postscript"></a>
### まとめ

以前は Mac に外付けディスクを取り付けて TimeMachine と CoreOS のバックアップの両方を行っていた。
Windows に移行した結果、Windows では本体のバックアップをやめた。
本来はやったほうが良いのだが、書類は iCloud に置いてあるし、メモは付箋アプリでやっている。
とりあえず必要なものはクラウドにバックアップされているので、Windows は立ち上がればよかろうなのだ、で行く。

その結果、CoreOS を入れてあるマシンに直接外付けディスクをつないでバックアップしたら良いじゃん、ということになった。

調べ始めると最初に Ignition Config で Unit ファイルを作成する方法が出てきたが、とりあえず今回は手動で Unit ファイルを設置してみた。

外付けディスクの要領にはかなり余裕があるので、別な用途も考えてみよう。


[TOP](#top)
<a id="reference"></a>
### 参考資料

- [【ゼロから解説】Linuxのフォーマットの方法](https://eng-entrance.com/linux-format)
- [Mounting Partitions Using Systemd | James Oguya](https://oguya.ch/posts/2015-09-01-systemd-mount-partition/)


[TOP](#top)
