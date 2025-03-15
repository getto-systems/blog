# Keychron K4 キーボードが届いた話
<a id="top"></a>

###### CONTENTS

1. [なにがやりたいのか](#purpose)
1. [キーマッピング](#change-keymap)
1. [Microsoft IME](#change-ime)
1. [DvorakJ の基本設定](#setup-dvorakj)
1. [直接入力](#change-qwerty-layout)
1. [日本語入力](#change-jp-layout)
1. [テンキー](#change-tenkey-layout)
1. [まとめ](#postscript)
1. [参考資料](#reference)


###### ENVIRONMENTS

- Microsoft IME
- SharpKeys
- DvorakJ


<a id="purpose"></a>
### なにがやりたいのか

某モヒカンSlack でそそのかされて [Keycron K4 Mechanical Keyboard](https://www.keychron.com/products/keychron-k4-mechanical-keyboard) を買ってしまった。
テンキーには一切興味なかったけど、テンキーで数字を入力すれば、記号・日本語に使えるキーが増えるじゃん。

これが到着してしまったので、キーボードレイアウトのカスタマイズを始めた。
Mac では Karabiner-Elements を使用していたが、Windows に乗り換えたのでアプリの選択から始めることになった。
めちゃくちゃ時間かかることはわかっているけど、キーボードが届いちゃったんだからしかたないよね。

とりあえず今のところ、テンキーによる数字の入力はまだ慣れないが、日本語の入力に関してはなかなかいい感じだ。


[TOP](#top)
<a id="change-keymap"></a>
### キーマッピング

Cap Lock と Control の位置が逆なのでこれを変更したい。
これをやるにはレジストリを変更するんだね。
バイナリデータを入力しないといけないので、そのためのツールが欲しい。

Keycron キーボードについてきた説明書に SharpKeys を使えばいいよ、と書いてあった。
これはスキャンコードのマッピングデータをレジストリに書き込むツールだ。

これを管理者として実行して、以下のキーのマッピングを変更した。

- Key: `~` : ここはエスケープキーの位置だよ
- Special: Caps Lock : Control に変更
- Special: Left Ctrl : Caps Lock に変更

さらに右上の Home とかが並んでいるところ、Delete を Backspace の近くにしたい。

- Special: Home : Delete に変更
- Special: End : Home に変更
- Special: Page Up : End に変更
- Special: Page Down : Page Up に変更
- Special: Delete : Page Down に変更


[TOP](#top)
<a id="change-ime"></a>
### Microsoft IME

IME のオン、オフのキーを変更したい。
以前のキーボードでは変換・無変換に割り当てていたが、そんなキーはないので、それぞれ以下のキーを使用することにした。

- Ctrl + Space : IME オフ
- Shift + Space : IME オン

スペースキーがやたら長いけど、これを分割してスペースキーを３つにする、という発想は出てこないですよね。
日本語入力的にはそうなってるとかなり良いのだけど。


[TOP](#top)
<a id="setup-dvorakj"></a>
### DvorakJ の基本設定

入力の状態に応じたキーマップの変更には DvorakJ を使用することにした。
数年更新がないけど、動くのでヨシ。

基本的な設定は以下の通りにした。

- 101キー（英語配列）のキーボードを使用しているにチェック
- 「その他」の項目は適当に

特殊キーに機能を割り当てる設定があるが、これはやっていない。


[TOP](#top)
<a id="change-qwerty-layout"></a>
### 直接入力

直接入力の項目では独自の設定ファイルを指定する。
このファイルの内容は以下の通り。

```txt
同時に打鍵する配列

/*
 * CiNii Article -  History of Standardization of Keyboards : ANSI INCITS 154
 * http://ci.nii.ac.jp/naid/110003892250
 *
 * Keyboard layout - Wikipedia, the free encyclopedia
 * http://en.wikipedia.org/wiki/Keyboard_layout#United_States
 */

[
{!}| @ | ( | ) |{&}| * | * |{^}| / | = | - | * | \ |
 q | w | e | r | t | y | u | i | o | p | [ | ] |
 a | s | d | f | g | h | j | k | l | : | " |   |
 z | x | c | v | b | n | m | , | . | _ |   |
]

-shift[
{!}| ` |{#}| $ | % | * | * |{^}| ~ |{+}| * | * |@@@|
 Q | W | E | R | T | Y | U | I | O | P |{{}|{}}|
 A | S | D | F | G | H | J | K | L | ; | ' |   |
 Z | X | C | V | B | N | M | < | > | ? |   |
]
```

数字ではなく、記号を入力するようにしてある。
これは６と７のキーが非常に打ちにくいので、これを使用しないような配列にしたかったため。
数字は完全にテンキーを使用する。


[TOP](#top)
<a id="change-jp-layout"></a>
### 日本語入力

日本語入力の項目では独自の設定ファイルを指定する。
このファイルの内容は以下の通り。

```txt
順に打鍵する配列

/*
 * 月配列俺式窓
 * https://github.com/shun-fix9/qwerty
 */

-option-input[
    [d] | -20
    [k] | -25
    [/] | -35
]

/* 単打 */
[
 ば | ご | じ | で | だ |うぉ|うぇ| べ | ぼ | び | ぢ |
 そ | こ | し | て | よ | つ | ん | い | の | り | ち | づ |
 は | か |    | と | た | く | う |    | き | れ | ぷ |
 す | け | に | な | さ | っ | る | 、 | 。 |    |
]

[k][
 ぐ | げ | ず | ぶ | ぎ | ヴ |ヴォ|    |    |    |    |
 ぞ | ひ | ほ | ふ | め |    |    |    |    |しぇ|    |    |
 ど | を | ら | あ | よ |みゅ|ふぉ|    |ふぁ|みょ|みゃ|
でぃ| へ | せ | が | ざ |ふぃ|ふぇ|    |ふゅ|ちぇ|
]

[d][
    |    |    |    |    |ヴェ|ヴァ| ぺ | ぽ | ぴ |ひゃ|
    |    |    |    |    | ぬ | え | み | や | ば | 「 | 」 |
てぃ|しゃ|    |しゅ|じぇ| ま | お | も | わ | ゆ |ひょ|
にゃ|    |しょ|    |    | む | ろ | ね | ー | ぜ |
]

[/][
 ： | ・ | （ | ） | ％ |ヴィ|うぃ|    |    |    |    |
ぎゃ|ぎゅ|ぎょ|じゃ|びゃ|    |ひゅ|にゅ|    |    |    |    |
ちゃ|ちゅ|ちょ|じゅ|びゅ| ぱ |りゅ|りょ|りゃ|    |    |
きゃ|きゅ|きょ|じょ|びょ|ぴゅ|ぴょ|ぴゃ|    |    |
]
```

月配列をベースにした俺用配列。
ここでも６と７のキーはほぼ使用しない文字を割り当ててある。


[TOP](#top)
<a id="change-tenkey-layout"></a>
### テンキー

テンキーの項目では独自の設定ファイルを指定する。
このファイルの内容は以下の通り。

```txt
/*
 * キーリスト (AutoHotkeyJp)
 * http://sites.google.com/site/autohotkeyjp/reference/KeyList
 */

/*
 * SUNDSTRAND - Google Patent Search
 * http://www.google.com/patents/about?id=xs1SAAAAEBAJ&dq=1198487
 */

-NumLock, -CapsLock, [
|             | {NumpadDiv} | {NumpadMult}  |
| {NumpadSub} | {NumpadAdd} | {NumpadEnter} |
|-------------+-------------+---------------|
| {Numpad7}   | {Numpad8}   | {Numpad9}     |
| {Numpad4}   | {Numpad5}   | {Numpad6}     |
| {Numpad1}   | {Numpad2}   | {Numpad3}     |
|-------------+-------------+---------------|
| {Numpad0}   |             | {NumpadDot}   |
]
```

同梱されている設定ファイルは NumLock のみ設定されていたが、CapsLock も書かないとうまくいかなかった。
ただ、これは CapsLock に IME オンを割り当てていたせいである可能性がある。

テンキーでカーソル移動したいのかな。
Home とかが押しやすくなるのは確かに良いような気はする。


[TOP](#top)
<a id="postscript"></a>
### まとめ

キーボードが無駄に光るの最高。


[TOP](#top)
<a id="reference"></a>
### 参考資料

- [Keycron K4 Mechanical Keyboard](https://www.keychron.com/products/keychron-k4-mechanical-keyboard)
- [shun-fix9/qwerty | GitHub](https://github.com/shun-fix9/qwerty)


[TOP](#top)
