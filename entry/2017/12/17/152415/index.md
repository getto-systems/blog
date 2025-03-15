---
title: Mac で「かな」配列をカスタマイズする - その後
---
<a id="top"></a>

- 前の記事「[Karabiner-Elements で「かな」配列をカスタマイズする](/entry/2017/09/23/172055)」の後、 IME の状態を取れるようになった
- 複数キー同時入力でうまく入力できないことがある問題に対する workaround について

###### CONTENTS

1. [IME の状態を条件に使用する](#input_source_if)
1. [複数キーの同時入力でうまく入力できない問題](#duplicate-key-input)
1. [まとめ](#postscript)
1. [参考資料](#reference)

###### SOURCE

1. [shun-fix9/karabiner-elements-complex_modifications](https://github.com/shun-fix9/karabiner-elements-complex_modifications)

###### APPENDIX

1. [新下駄配列](#jp-keyboard-layout)


<a id="input_source_if"></a>
### IME の状態を条件に使用する

- [Karabiner-Elementsで日本語入力状態を把握してキー設定出来る様になった](https://rcmdnk.com/blog/2017/10/30/computer-mac-karabiner/)

この記事にある通り、 `input_source_if` で IME の状態を条件の中で使用できるようになった。

サンプルとしてEscキーに対するマッピングの例。

```json
{
  "type": "basic",
  "conditions": [
    {"type": "input_source_if","input_sources": [{"language": "ja"}]}
  ],
  "from": {"key_code": "escape"},
  "to": [{"key_code": "japanese_eisuu"},{"key_code": "escape"}]
}
```

これは、日本語入力モードの場合、Escキーを「英数」＋「Escキー」に割り当てる設定だ。
元の記事でも書いてあるが、 Vim を使用しているとこのマッピングがなかなか便利に使える。

`input_source_if` を使用することで、「かな」「英数」入力時にわざわざ `is_japanese_kana` 変数を操作する、ということをしなくて済むようになる。
また、パスワードの入力等、 IME が自動的に無効化される場合などもこれでうまく対応できる。


[TOP](#top)
<a id="duplicate-key-input"></a>
### 複数キーの同時入力でうまく入力できない問題

例えば、以下のような設定の場合、うまくいかない事がある。

```json
{
  "type": "basic",
  "conditions": [
    {"type": "input_source_if","input_sources": [{"language": "ja"}]},
  ],
  "from": {"key_code": "z"},
  "to": [{"key_code": "s"},{"key_code": "u"}]
},
{
  "type": "basic",
  "conditions": [
    {"type": "input_source_if","input_sources": [{"language": "ja"}]},
  ],
  "from": {"key_code": "m"},
  "to": [{"key_code": "r"},{"key_code": "u"}]
},
```

この設定で「する」と打鍵すると、時々「すr」になってしまう。
「る」と入力されるべき `r` `u` のうち、後の `u` が、うまく入力できないことがあるのだ。

Karabiner-Elements の Event Viewer で、キーを押した時にどんな処理かしているのかを見る事ができる。
これで調べた結果、ある文字が Key Press 状態の時、同じ文字のイベントが無視されてしまうように見える。

そこで、各マッピングの最後を空のイベントにすることで、どの文字も Key Press 状態にならなくしてみた。

```json
{
  "type": "basic",
  "conditions": [
    {"type": "input_source_if","input_sources": [{"language": "ja"}]},
  ],
  "from": {"key_code": "z"},
  "to": [{"key_code": "s"},{"key_code": "u"},{}]
},
{
  "type": "basic",
  "conditions": [
    {"type": "input_source_if","input_sources": [{"language": "ja"}]},
  ],
  "from": {"key_code": "m"},
  "to": [{"key_code": "r"},{"key_code": "u"},{}]
},
```

これで一応、「する」もうまく入力できるようになった。
ただし、 Key Press しなくなるので、キーを押し続けて文字を入力することはできなくなる。


[TOP](#top)
<a id="postscript"></a>
### まとめ

Karabiner-Elements がアップデートされて、機能が Karabiner に追いついてきた。


[TOP](#top)
<a id="reference"></a>
### 参考資料

- [Karabiner-Elementsで日本語入力状態を把握してキー設定出来る様になった](https://rcmdnk.com/blog/2017/10/30/computer-mac-karabiner/)


[TOP](#top)
<a id="jp-keyboard-layout"></a>
#### 新下駄配列

- インポート : [import](karabiner://karabiner/assets/complex_modifications/import?url=https%3A%2F%2Fraw.githubusercontent.com%2Fgetto-systems%2Fkarabiner-elements-jp-keyboard-layout%2Fmaster%2Fjp-keyboard-layout.json)
- ソース : [getto-systems/karabiner-elements-jp-keyboard-layout : GitHub](https://github.com/getto-systems/karabiner-elements-jp-keyboard-layout)

[新下駄配列を作りました : ローマ字入力でもなく、かな入力でもなく](http://kouy.exblog.jp/13627994/) を参考に作成した。


[TOP](#top)
