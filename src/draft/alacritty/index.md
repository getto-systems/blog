# Windows10 で Alacritty する話
<a id="top"></a>

某Slack コミュニティで Rust 製のターミナルエミュレータの [Alacritty](https://github.com/jwilm/alacritty) が良いという話を聞いたので、試してみる。

###### CONTENTS

1. [Alacritty について](#about-alacritty)
1. [Chocolatey インストール](#install-chocolatey)
1. [Alacritty インストール](#install-alacritty)
1. [エスケープキー対応](#esc-workaround)
1. [まとめ](#postscript)
1. [参考資料](#reference)


###### ENVIRONMENTS

- Windows 10 Pro


<a id="about-alacritty"></a>
### Alacritty について

- [jwilm/alacritty | GitHub](https://github.com/jwilm/alacritty)

Rust 製のターミナルエミュレータ。
はやい、らしい。
実感はないが、気に入ったので使うことにした。

とりあえずターミナルエミュレータへの要件は以下くらい。

- フォントの設定ができる
- 背景透過ができる
- 起動時の位置、サイズの設定ができる

cmd や wsl でもほぼ事足りるのだが、これらで使用できるフォントは限られているので別な選択肢が欲しい。


#### Alacritty にできないこと

2019/11/15 現在、日本語入力がインラインでできない。
Windows 10 標準の IME は、入力中の文字が左上の小さなウインドウに表示されるので何とかなる。
ちなみに Mac 標準の日本語入力はこれがなかったので Alacritty の使用をあきらめた。

また、複数のウインドウを立ち上げることもできない。
どうやら近々での複数ウインドウ対応はなさそう。
ログを流す用のウインドウを別に立ち上げたいのだけど、これは Windows の cmd とか wsl を使用することにする。

さらに、エスケープキーの入力がどこかに吸収されてしまうことがあるように感じる。
vi で入力すると `<M-S-F3>` みたいになる。
常に、というわけではない。
ただ、これが Alacritty のせいかは、はっきりしていない。


[TOP](#top)
<a id="install-chocolatey"></a>
### Chocolatey インストール

[Alacritty の README](https://github.com/jwilm/alacritty) によると、chocolatey を使用してインストールができる。

[chocolatey](https://chocolatey.org/) は Windows のパッケージマネージャ。
まずはこれをセットアップする。

[Installing Chocolatey](https://chocolatey.org/install) の手順に従って作業する。

スタートメニューを右クリックして、PowerShell を管理者権限で立ち上げ、以下のコマンドを実行する。

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))
```

これで chocolatey のインストールが完了する。


[TOP](#top)
<a id="install-alacritty"></a>
### Alacritty インストール

管理者権限の PowerShell から、以下のコマンドを実行することで Alacritty をインストールできる。

```powershell
choco install alacritty
```

Alacritty の設定は `C:\Users\{ユーザー名}\AppData\Roaming\alacritty\alacritty.yml` にある。
AppData は隠しフォルダなのでエクスプローラーには表示されない場合もあるが、隠しフォルダを表示したり、パスを入力するといける。

[WSL + Alacritty で Powerline を使う | hiromasa.another :o)](https://another.maple4ever.net/archives/2741/) を参考に設定していく。


#### font

font には Windows にインストールしたものが使用可能。

```yaml
font:
  normal:
    family: あんずもじ等幅
```

手書き風フォントの[あんずもじ](http://www8.plala.or.jp/p_dolce/index.html)を愛用しているので、これが使用できるかが最重要。


#### opacity

壁紙の透過がしたいので、背景の透過率を設定する。

```yaml
background_opacity: 0.8
```

Alacritty で背景透過をしても、Vim の色設定で背景色が指定されていると背景が透過されなくなる。
背景色が NONE な colorscheme を選択すれば良いが、少ないので以下の設定を行って背景色をキャンセルした。

```vim
colorscheme monokai_pro
hi Normal guibg=NONE
hi LineNr guibg=NONE
hi NonText guibg=NONE
hi SpecialKey guibg=NONE
```


#### 起動時の位置、サイズ

ターミナルエミュレータの起動位置は固定したい。
作業が終わったら shutdown する運用にしているため、起動時に手で調整したくない。

```yaml
window:
  dimensions:
    columns: 140
    lines: 40
  position:
    x: 100
    y: 15
  padding:
    x: 5
    y: 5
```


#### shell

wsl を起動するように設定。

```yaml
shell:
  program: /Windows/System32/wsl.exe
```


#### Windows 10 ConPTY backend の有効化

新しい API の有効化を行う。
実際に何が有効になるのかはよくわかっていないが、とりあえず vim の色設定が通るようになった。

```yaml
enable_experimental_conpty_backend: true
```


#### 色設定

[Color schemes | GitHub jwilm/alacritty Wiki](https://github.com/jwilm/alacritty/wiki/Color-schemes) に、色設定のサンプルが載っているのでこれを使用した。

```yaml
# Monokai Pro
colors:
  # Default colors
  primary:
    background: '0x000000'
    foreground: '0xFCFCFA'

  # Normal colors
  normal:
    black:   '0x403E41'
    red:     '0xFF6188'
    green:   '0xA9DC76'
    yellow:  '0xFFD866'
    blue:    '0xFC9867'
    magenta: '0xAB9DF2'
    cyan:    '0x78DCE8'
    white:   '0xFCFCFA'

  # Bright colors
  bright:
    black:   '0x727072'
    red:     '0xFF6188'
    green:   '0xA9DC76'
    yellow:  '0xFFD866'
    blue:    '0xFC9867'
    magenta: '0xAB9DF2'
    cyan:    '0x78DCE8'
    white:   '0xFCFCFA'
```


[TOP](#top)
<a id="esc-workaround"></a>
### エスケープキー対応

時々エスケープキーの入力がどこかに吸収される感じがする。
これが Alacritty のせいであるかは、はっきりしていない。

#### Vim のエスケープキー対応

Vim でエスケープキーが通らないのは困るので、エスケープキーのキーバインドを追加した。

```vim
imap <C-L> <Esc>
```

#### Tmux のコピーモード対応

Tmux ではコピーモードのキーバインドにエスケープキーを使用していたが、これも `Ctrl-L` に変更した。

```vim
bind C-l copy-mode
```


[TOP](#top)
<a id="postscript"></a>
### まとめ

Windows で Alacritty を使用する方法をまとめた。

いくつか気になる部分はあるが、気に入ったので使用することにした。
あと Rust を使い始めたので、このプロジェクトに貢献できたらいいな。


[TOP](#top)
<a id="reference"></a>
### 参考資料

- [Installing Chocolatey | Chocolatey](https://chocolatey.org/install)
- [WSL + Alacritty で Powerline を使う | hiromasa.another :o)](https://another.maple4ever.net/archives/2741/)
- [jwilm/alacritty | GitHub](https://github.com/jwilm/alacritty)
- [Avoid the escape key | Vim fandom](https://vim.fandom.com/wiki/Avoid_the_escape_key)


[TOP](#top)
