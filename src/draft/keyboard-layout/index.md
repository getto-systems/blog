---
title: Mac で「かな」配列をカスタマイズする - 2018版
---
<a id="top"></a>

- 前の記事「[Mac で「かな」配列をカスタマイズする](/entry/2017/12/17/152415)」の後、キーの同時押しの設定が追加された

###### CONTENTS

1. [かな配列における同時打鍵](#simultaneous)
1. [同時打鍵の設定](#setting)
1. [まとめ](#postscript)
1. [参考資料](#reference)

###### APPENDIX

1. [新下駄配列](#jp-keyboard-layout)

###### SOURCE

- [shun-fix9/karabiner-elements-complex_modifications](https://github.com/shun-fix9/karabiner-elements-complex_modifications)
- [getto-systems/karabiner-elements-jp-keyboard-layout](https://github.com/getto-systems/karabiner-elements-jp-keyboard-layout)


###### ENVIRONMENTS

- Karabiner-Elements : 11.6.0


<a id="simultaneous"></a>
### かな配列における同時打鍵

中指シフトの配列を試す中で、同時打鍵が欲しくなる場面は結構あった。
どちらのキーが先かは関係なく、同時に押されたことを認識してキーのマッピングを行うものだ。

しかし、同時打鍵を設定できるものが少なかったせいもあって、これまで同時打鍵を前提としない設定を行ってきた。

Karabiner-Elements の 11.6.0 で同時押しの設定ができるようになったので、これを機に同時打鍵の設定をしてみることにした。


[TOP](#top)
<a id="setting"></a>
### 同時打鍵の設定

```json
{
  "type": "basic",
  "conditions": [
    {"type": "input_source_if","input_sources": [{"language": "ja"}]}
  ],
  "from": {"simultaneous": [{"key_code": "s"},{"key_code": "y"}]},
  "to": [{"key_code": "d"},{"key_code": "u"},{}]
}
```

この設定で、「S」「Y」の同時打鍵で「づ」が入力される。

これに加えて、単打鍵の設定を追加するのだが、これは同時打鍵の設定の後に追加する必要がある。

```json
{
  "type": "basic",
  "conditions": [
    {"type": "input_source_if","input_sources": [{"language": "ja"}]}
  ],
  "from": {"simultaneous": [{"key_code": "s"},{"key_code": "y"}]},
  "to": [{"key_code": "d"},{"key_code": "u"},{}]
},

{
  "type": "basic",
  "conditions": [
    {"type": "input_source_if","input_sources": [{"language": "ja"}]}
  ],
  "from": {"key_code": "y"},
  "to": [{"key_code": "t"},{"key_code": "u"},{}]
}
```

これで、「Y」だけ押した場合は「つ」、「S」と「Y」を同時に押した場合は「づ」が入力される設定となる。

Karabiner-Elements の設定は、先に書いたものが優先的に評価されるようだ。
単打鍵は同時打鍵よりも素早く認識されてしまうため、単打鍵の設定はまとめて最後に書いた方がスムーズに入力を行える。


[TOP](#top)
<a id="postscript"></a>
### まとめ

この設定項目のおかげで、ほとんどの中指シフトの設定を実現できる気がする。


[TOP](#top)
<a id="reference"></a>
### 参考資料

- [NEWS : Karabiner-Elements](https://github.com/tekezo/Karabiner-Elements/blob/master/NEWS.md)


[TOP](#top)
<a id="jp-keyboard-layout"></a>
#### 新下駄配列

- インポート : [import](karabiner://karabiner/assets/complex_modifications/import?url=https%3A%2F%2Fraw.githubusercontent.com%2Fgetto-systems%2Fkarabiner-elements-jp-keyboard-layout%2Fmaster%2Fjp-keyboard-layout.json)
- ソース : [getto-systems/karabiner-elements-jp-keyboard-layout : GitHub](https://github.com/getto-systems/karabiner-elements-jp-keyboard-layout)

同時打鍵の設定で再構成したもの。


[TOP](#top)
