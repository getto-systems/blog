# ラズパイに USB をさして電源を落とそう大作戦
<a id="top"></a>

###### CONTENTS

1. [なんでそんなことをするのか](#purpose)
1. [USB をさしたときの様子を確認する](#udevadm-monitor)
1. [USB デバイスの詳細を確認する](#udevadm-info)
1. [USB をさしたときにスクリプトを起動する](#udev-rules)
1. [まとめ](#postscript)
1. [参考資料](#reference)


<a id="purpose"></a>
### なんでそんなことをするのか

ラズベリーパイは電源につなげることで起動する。
しかし、電源ボタンがないので、ディスプレイとキーボードをつないで `shutdown` しないと電源を切ることができない。

[先日の記事](http://shun.dev.getto.systems:12080/entry/2019/12/14/011628)で、ラズパイをルーターにしたのだが、電源が切れないので不便だった。
ディスプレイとかをつながなくても電源を切れる方法が欲しい。

- 電源を引き抜くことで電源を落とすと、10回に1回くらい壊れるのでやりたくない

ラズパイに電源ボタンをつける記事はいくつか見つかったが、少々大仰なのでほかの方法を見つけたい。
起動後に USB キーボードをつなぐと認識するので、USB デバイスは監視されているようだ。

USB デバイスを認識したときにフックスクリプトを走らせることができれば、そこで `shutdown` できる。
その方法をまとめる。


[TOP](#top)
<a id="udevadm-monitor"></a>
### USB をさしたときの様子を確認する

以下のコマンドでデバイスの接続を監視できる。

```bash
udevadm monitor
```

このコマンドを実行した状態で USB デバイスを抜きさしすると、`add` とか `remove` とかが観察できる。


[TOP](#top)
<a id="udevadm-info"></a>
### USB デバイスの詳細を確認する

以下のコマンドでデバイスの情報を確認できる。

```bash
udevadm info $DEVICE_PATH
```

`$DEVICE_PATH` にはデバイスのパスを指定する。

パスがわからないときは以下のコマンドを試してみる。

```bash
udevadm info -e
```

出力がとても多いが、とにかくすべて表示されるので何とかする。

手ごろな USB デバイスとして YubiKey があったので、これをさしてみると ID_SERIAL の値が `Yubico_Security_Key_by_Yubico` だった。
これを使えば YubiKey を認識できそうだ。


[TOP](#top)
<a id="udev-rules"></a>
### USB をさしたときにスクリプトを起動する

`/etc/udev/rules.d` にファイルを設置することで、デバイスを認識したときのルールを記述できる。

ここでは `80-usb.rules` という名前で以下の内容を保存する。

```udev.rules
SUBSYSTEM=="usb", ACTION=="add", ENV{ID_SERIAL}=="Yubico_Security_Key_by_Yubico",  RUN+="/home/pi/bin/shutdown.sh"
```

この設定で、以下の場合に `/home/pi/bin/shutdown.sh` を実行する、という指示になる。

- `SUBSYSTEM=="usb"` : USB デバイスが
- `ACTION=="add"` : 接続した
- `ENV{ID_SERIAL}=="Yubico_Security_Key_by_Yubico"` : ID_SERIAL が YubiKey のやつ

詳細は udevadm の man ページに詳しく書いてある。

`/home/pi/bin/shutdown.sh` は以下の内容で作成する。

```bash
#!/bin/sh
shutdown -h now
```

root ユーザーで実行されるので、これで電源が切れる。

以下のコマンドで rule を有効化する。

```bash
sudo udevadm control --reload
```

これで YubiKey をさすと `shutdown` するようになった。


[TOP](#top)
<a id="postscript"></a>
### まとめ

ラズパイに USB デバイスをさしたときに電源を切る方法をまとめた。

これでディスプレイをつながなくてもよくなった。
どんな YubiKey でも電源を切っちゃう気がするけどまあヨシ。


[TOP](#top)
<a id="reference"></a>
### 参考資料

- [How to Use Udev for Device Detection and Management in Linux | TecMint](https://www.tecmint.com/udev-for-device-detection-management-in-linux/)


[TOP](#top)
