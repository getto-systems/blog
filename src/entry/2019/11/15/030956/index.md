# ssh で ed25519 する話
<a id="top"></a>

###### CONTENTS

1. [鍵の生成](#sshkeygen)
1. [ssh で接続する](#connect-ssh)
1. [まとめ](#postscript)
1. [参考資料](#reference)


###### ENVIRONMENTS

- Windows 10 Pro
- Ubuntu 18.04 on WSL


<a id="sshkeygen"></a>
### 鍵の生成

以下のコマンドで ed25519 の鍵を生成する。

```bash
ssh-keygen -t ed25519
```

ビット長の指定もないし、public key がだいぶ短いのでなんだか不安になるけど、これが最強らしい。


[TOP](#top)
<a id="connect-ssh"></a>
### ssh で接続する

鍵が ed25519 のものしかない場合は、特別なことをしなくても ssh でその鍵が使用される。

```bash
ssh user@remote-host
```


[TOP](#top)
<a id="postscript"></a>
### まとめ

ed25519 の鍵を使用して ssh してみた。
特に rsa の鍵と変わる部分もなく、いつも通りに接続できた。


[TOP](#top)
<a id="reference"></a>
### 参考資料

- [ssh-keygen - Generate a New SSH Key | SSH.com](https://www.ssh.com/ssh/keygen/)


[TOP](#top)
