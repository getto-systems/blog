# Windows Subsystem for Linux してみる話
<a id="top"></a>

WSL をインストールして Linux の shell 環境を整える。

###### CONTENTS

1. [WSL インストール](#install-wsl)
1. [Ubuntu を選択](#install-ubuntu)
1. [ホスト名を変更する](#change-hostname)
1. [まとめ](#postscript)
1. [参考資料](#reference)


###### ENVIRONMENTS

- Windows 10 Pro


<a id="install-wsl"></a>
### WSL インストール

Microsoft Store に WSL のアプリがいくつかあるが、初期状態ではインストールできなかった。

[Ubuntu18.04をWindows10で最も簡単にインストールする方法【WSL・無料】](https://ja.seo.jxyz.info/ubuntu18-04-on-windows10-easy/) の手順で WSL をインストールする。

スタートメニューを右クリックして、PowerShell を管理者権限で立ち上げ、下記コマンドを実行する。

```powershell
Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux
```

[ドキュメント](https://docs.microsoft.com/en-us/powershell/module/dism/enable-windowsoptionalfeature?view=win10-ps) によると、Online は現在稼働中の OS の設定を変更、FeatureName で WSL を有効化、しているようだ。

これで、Microsoft Store から WSL をインストールできるようになる。


[TOP](#top)
<a id="install-ubuntu"></a>
### Ubuntu を選択

Microsoft Store から Ubuntu 18.04 を選択した。
最初のユーザーを作成するとインストールが完了する。

インストールに成功すると、スタートメニュー右クリックで「ファイル名を指定して実行」から wsl でコンソールを起動できる。

あとは普通の Ubuntu のようにセットアップすれば良い。

ちなみに「コード化しない環境へのツールの追加は最小限にする」というポリシーがあるので、現在も WSL の Ubuntu はデフォルトの状態のまま。


[TOP](#top)
<a id="change-hostname"></a>
### ホスト名を変更する

wsl で shell を起動するとホスト名が表示される。
デフォルトのままだとかわいくないので、変更したい。

「設定」→「システム」→「バージョン情報」の「デバイスの仕様」あたりに、「この PC の名前を変更」ボタンがある。
ここからホスト名を変更できる。


[TOP](#top)
<a id="postscript"></a>
### まとめ

Windows Subsystem for Linux で Ubuntu をインストールしてみた。

これでやるのは ssh だけなのだけど、PowerShell と格闘しなくて済んでほっとしている。


[TOP](#top)
<a id="reference"></a>
### 参考資料

- [Ubuntu18.04をWindows10で最も簡単にインストールする方法【WSL・無料】](https://ja.seo.jxyz.info/ubuntu18-04-on-windows10-easy/)
- [Enable-WindowsOptionalFeature | Microsoft Docs / Windows PowerShell](https://docs.microsoft.com/en-us/powershell/module/dism/enable-windowsoptionalfeature?view=win10-ps)


[TOP](#top)
