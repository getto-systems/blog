# ラズパイをルーターにしよう大作戦
<a id="top"></a>

![ネットワーク](/resources/2019/12/raspi-router/RaspberryPi-Router.png)

###### CONTENTS

1. [なんでこんなことをするのか](#purpose)
1. [ラズパイを Wi-Fi に接続する](#connect-wifi)
1. [DHCP サーバーの設定](#setup-dhcp-server)
1. [iptables の設定](#setup-iptables)
1. [まとめ](#postscript)
1. [参考資料](#reference)


###### ENVIRONMENTS

- Raspberry Pi 3 Model B
- Raspbian Buster Lite : 2019-09-26 : 4.19


<a id="purpose"></a>
### なんでこんなことをするのか

開発環境として Intel NUC に CoreOS を入れている。
CoreOS は有線接続しかできないので、Intel NUC は有線接続でつないでいる。

この開発環境を外に持ち出す場合、Intel NUC と ThinkPad は同じネットワークにある必要がある。
Intel NUC の CoreOS では、開発中の Web アプリケーションが見える状態だ。
なのでこのネットワークは外部のネットワークとは隔離されていてほしい。
以前は Intel NUC に Wi-Fi できるやつをつけて、スマホのテザリングでつないでいた。

今年の４月末に開発合宿をする機会があったのだが、参加人数が３０人近かった。
このため、個人でテザリングする運用だとなかなか厳しい。
それで、なるべく無線を使用しない方向で考えてみた。

![ネットワーク](/resources/2019/12/raspi-router/RaspberryPi-Router.png)

この図の「スマホ」の部分は、利用可能な Wi-Fi ネットワークに置き換えられる。
これで、不必要な無線接続をなくすことができる。

バッテリーは Intel NUC のために、65W 出力できるでかいやつがある。
スイッチングハブは持ち運びを考えて、USB 給電できるものを用意した。
これなら電源が無くても、４時間程度ならすべてまかなえる。

ネットワークの知識が貧弱なので、この構成で動かしていいものか、あまり自信はない。
ただ、この構成で動かすのは、以下の場合くらいなのでまあ問題はないかな。

- 開発合宿なんかで長期間開発するとき : メンバーのなかに攻撃を仕掛けてくる人はいないでしょう
- 移動中や、出先で緊急対応するとき : ラズパイはテザリングネットワークの内側だし、短時間の利用なので平気かな


[TOP](#top)
<a id="connect-wifi"></a>
### ラズパイを Wi-Fi に接続する

まずは Wi-Fi に接続する。

- [ラズパイのWi-Fi設定と固定IPアドレスを設定する | 千草ウェブ](https://chigusa-web.com/%E3%83%A9%E3%82%BA%E3%83%91%E3%82%A4%E3%81%AEwi-fi%E8%A8%AD%E5%AE%9A%E3%81%A8%E5%9B%BA%E5%AE%9Aip%E3%82%A2%E3%83%89%E3%83%AC%E3%82%B9%E3%82%92%E8%A8%AD%E5%AE%9A%E3%81%99%E3%82%8B/)

この記事を参考に設定した。

以下のスクリプトで設定できる。

```bash
#!/bin/bash

SSID="Wi-Fi の SSID"
PASS="パスフレーズ"

wpa_passphrase "$SSID" "$PASS" >> /etc/wpa_supplicant/wpa_supplicant.conf
```

このスクリプトを root 権限で実行することで `/etc/wpa_supplicant/wpa_supplicant.conf` が更新される。
設定が間違っていなければ、`reboot` すれば Wi-Fi に接続できるはず。

`ip addr` で `wlan0` 的な名前のインターフェイスに IP アドレスが割り当たっていれば OK。
適当なドメインに `ping` して通れば確実だ。

接続できない場合は以下のことを確認してみる。

- SSID と PASS に Typo はないか
- ほかの機器で接続できるか
- Wi-Fi ネットワーク側でアクセス拒否していないか


[TOP](#top)
<a id="setup-dhcp-server"></a>
### DHCP サーバーの設定

Ethernet 側のネットワークに対して DHCP サービスを提供する。

- [aspberry PiをWiFiルーターにする・外付けハードディスクで運用する方法 | Qiita](https://qiita.com/kazz12211/items/091e5f7eea2785a4eae4)

この記事を参考に設定した。

`eth0` に static IP を設定する。
ネットワークは `192.168.100.0/24` にした。
Wi-Fi 側のネットワークが同じなら、設定を変更する必要がある。

```dhcpcd.conf
# /etc/dhcpcd.conf

...（中略）

interface eth0
static ip_address=192.168.100.1/24
```

`/etc/dhcpcd.conf` ファイルで設定する。
あとで `/etc/dhcp/dhcpd.conf` ファイルも出てくるので紛らわしいが、こちらはデフォルトで存在するのでこっちから設定すれば間違わない。

設定する内容はこの２行で OK。
`reboot` して、設定が反映されていることを確認する。

このあと、DHCP サーバーである `isc-dhcp-server` をインストールする。

```bash
sudo apt-get update
sudo apt-get install isc-dhcp-server
```

こちらの設定は `/etc/dhcp/dhcpd.conf` ファイルで行う。

まず、`authoritative` のコメントアウトを外す。

```dhcp.conf
authoritative;
```

このネットワークの公式な DHCP サーバーならアンコメントする、と書いてあるのでそうした。
実際に何が起こるのかは理解していない。
[man page](https://linux.die.net/man/5/dhcpd.conf) によると、クライアントとの通信の際に確認を行うようになるようだ。

あと、先に設定したネットワークのサブネット設定を書く。

```dhcp.conf
subnet 192.168.100.0 netmask 255.255.255.0 {
  range 192.168.100.100 192.168.100.200;
  option broadcast-address 192.168.100.255;
  option routers 192.168.100.1;
  option domain-name-servers 8.8.8.8, 1.1.1.1;
}
```

`range 192.168.100.100 192.168.100.200;` には、割り当てる IP の範囲を設定する。
とりあえず 100 から 200 にした。
特に理由はない。

`option domain-name-servers 8.8.8.8, 1.1.1.1;` には参照するネームサーバーを列挙する。
このネットワークにつないだクライアントが名前解決できない場合はここを確認する。

さらに、`/etc/default/isc-dhcp-server` に対象のインターフェイスを設定する。

```isc-dhcp-server
INTERFACESv4="eth0"
```

設定が完了したら、LAN ケーブルをハブまでつないで、`isc-dhcp-server` を起動する。
（インストール時の起動には失敗しているので、`start` でよい）

```bash
sudo systemctl start isc-dhcp-server
```

起動に失敗した場合は `systemctl status isc-dhcp-server` や `/var/log/syslog` にログがあるのでトラブルシューティングする。
上記のように、LAN ケーブルをハブまでつないでないとサービスの起動が失敗した。
配線を済ませてからサービスを起動すること。


[TOP](#top)
<a id="setup-iptables"></a>
### iptables の設定

ルーターとして機能させるためには、パケットをうまく流す必要がある。
このため、iptables の設定を行う。

- [iptablesでLinuxをルーターに | にろきのメモ帳](https://blog.nhiroki.net/2013/12/06/iptables-linux-router)

この記事を参考に設定した。

まず、ip forward の設定を行う。

```sysctl.conf
net.ipv4.ip_forward = 1
```

`ipv4.ip_forward` に `1` を設定することで、`wlan0` と `eth0` の間でパケットのやり取りができるようになる。

さらに、iptables の設定を行うことで、パケットがうまく流れるようにする。

```bash
#!/bin/bash

WAN=wlan0
LAN=eth0

# Flush & Reset
iptables -F
iptables -t nat -F
iptables -X

# Default Rule
iptables -P OUTPUT ACCEPT
iptables -P FORWARD DROP
iptables -P INPUT DROP

iptables -A INPUT -i $LAN -j ACCEPT

# Filter out packets with private IP addresses from the Internet
iptables -A INPUT -i $WAN -s 192.168.0.0/16 -j DROP
iptables -A INPUT -i $WAN -s 172.16.0.0/12 -j DROP
iptables -A INPUT -i $WAN -s 10.0.0.0 -j DROP
iptables -A FORWARD -i $WAN -s 192.168.0.0/16 -j DROP
iptables -A FORWARD -i $WAN -s 172.16.0.0/12 -j DROP
iptables -A FORWARD -i $WAN -s 10.0.0.0 -j DROP

# Established
iptables -A INPUT -m state --state RELATED,ESTABLISHED -j ACCEPT

# Forward
iptables -A FORWARD -i $LAN -j ACCEPT
iptables -A FORWARD -i $WAN -m state --state RELATED,ESTABLISHERD -j ACCEPT

# Loopback
iptables -A INPUT -i lo -j ACCEPT
iptables -A OUTPUT -o lo -j ACCEPT

# SNAT
iptables -t nat -A POSTROUTING -o $WAN -j MASQUERADE
```

正直詳しく説明できない。
とにかくこれで iptables の設定ができる。

iptables の設定は再起動すると失われるので、起動時にこのスクリプトを実行する必要がある。
このため、`/etc/rc.local` にこのスクリプトの実行を追加した。

ここまで設定すると、`reboot` で LAN でつながっているクライアントがインターネットに接続できる。


[TOP](#top)
<a id="postscript"></a>
### まとめ

外で開発するときにラズパイを使用して環境を構築できるようにした。
必要なら無線をなるべく使用しないような構成にできた。

最近の記事では、ラズパイをルーターにするという内容のものがなかったので、あまり良い方法ではない可能性がある。
ネットワークの知識もあまりないので、このあたりの勉強もしないとなぁ。


[TOP](#top)
<a id="reference"></a>
### 参考資料

- [ラズパイのWi-Fi設定と固定IPアドレスを設定する | 千草ウェブ](https://chigusa-web.com/%E3%83%A9%E3%82%BA%E3%83%91%E3%82%A4%E3%81%AEwi-fi%E8%A8%AD%E5%AE%9A%E3%81%A8%E5%9B%BA%E5%AE%9Aip%E3%82%A2%E3%83%89%E3%83%AC%E3%82%B9%E3%82%92%E8%A8%AD%E5%AE%9A%E3%81%99%E3%82%8B/)
- [aspberry PiをWiFiルーターにする・外付けハードディスクで運用する方法 | Qiita](https://qiita.com/kazz12211/items/091e5f7eea2785a4eae4)
- [iptablesでLinuxをルーターに | にろきのメモ帳](https://blog.nhiroki.net/2013/12/06/iptables-linux-router)
- [dhcpd.conf(5) - Linux man page](https://linux.die.net/man/5/dhcpd.conf)


[TOP](#top)
