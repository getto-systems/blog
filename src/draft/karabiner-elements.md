---
title: Karabiner-Elements でかな配列をカスタマイズする
---
<a id="top"></a>

* [Karabiner](https://pqrs.org/osx/karabiner/index.html.ja) でかな配列を[月配列俺式](https://github.com/shun-fix9/keybord-layout-for-mac-with-keyremap)にしていた
* Sierra にアップデートしたら Karabiner が使用できなくなって悲しい
* [Karabiner-Elements](https://github.com/tekezo/Karabiner-Elements) が 2017/07 のアップデートで変数が使えるようになった

###### CONTENTS

1. [全体像](#overall)
1. [設定ファイルの概要](#config)
1. [IME の状態の保存](#set-ime-mode)
1. [各シフト状態の保存](#set-shift-mode)
1. [キーの置き換え](#replace-keys)
1. [まとめ](#postscript)
1. [参考資料](#reference)

###### SOURCE

* [shun-fix9/karabiner-elements-complex_modifications : GitHub](https://github.com/shun-fix9/karabiner-elements-complex_modifications)

<a id="overall"></a>
### 全体像

- 日本語 IME が有効な場合のみ、月配列用のキー置き換えを行う
- シフトキーを押している場合はキー置き換えを行わない


[TOP](#top)
<a id="config"></a>
### 設定ファイルの概要

以下のような設定ファイルを作成すると、 Karabiner-Elements の設定画面の「Complex Manipulators」タブで「Add rule」できるようになる。

- 設置するパスは `~.config/karabiner/assets/complex_modifications/`

```json
{
  "title": "Personal rules (@shun-fix9)",
  "rules": [
    {
      "description": "月配列俺式改二",
      "manipulators": [
        {
          "type": "basic",
          "from": {"key_code": "japanese_eisuu","modifiers": {"optional": ["any"]}},
          "to": [{"key_code": "japanese_eisuu"}],
          "to_after_key_up": [
            {"set_variable": {"name": "is_japanese_kana", "value": 0}},
            {"set_variable": {"name": "is_passthrough", "value": 0}}
          ]
        },

        (other manipulators...)
      ]
    }
  ]
}
```

`rules` には「Add rule」でまとめて有効/無効を切り替えたい粒度でルールを記述していく。

`manipulators` でキーを押した時の挙動を記述する。



[TOP](#top)
<a id="set-ime-mode"></a>
### IME の状態の保存

かな配列のカスタマイズなので、日本語 IME が有効になっている場合のみ、キーの置き換えをしたい。

「かな」を押した時にフラグを立てて、「英数」か押した時にフラグを下げることにする。

```json
{
  "type": "basic",
  "from": {"key_code": "japanese_eisuu","modifiers": {"optional": ["any"]}},
  "to": [{"key_code": "japanese_eisuu"}],
  "to_after_key_up": [
    {"set_variable": {"name": "is_japanese_kana", "value": 0}},
    {"set_variable": {"name": "is_passthrough", "value": 0}}
  ]
},
{
  "type": "basic",
  "from": {"key_code": "japanese_kana","modifiers": {"optional": ["any"]}},
  "to": [{"key_code": "japanese_kana"}],
  "to_after_key_up": [
    {"set_variable": {"name": "is_japanese_kana", "value": 1}},
    {"set_variable": {"name": "is_passthrough", "value": 0}}
  ]
},
{
  "type": "basic",
  "from": {"key_code": "left_control","modifiers": {"optional": ["any"]}},
  "to": [{"key_code": "left_control"}],
  "to_after_key_up": [{"set_variable": {"name": "is_passthrough", "value": 1}}]
},
```

フラグの名前は `is_japanese_kana` を使用する。

また、キーの置き換えを無効にしたい場合もある。
そこで、コントロールキーで `is_passthrough` フラグを立てて、キーの置き換えを無効にできるようにしておく。



[TOP](#top)
<a id="postscript"></a>
### まとめ



[TOP](#top)
<a id="reference"></a>
### 参考資料

- [pqrs-org/KE-complex_modifications : GitHub](https://github.com/pqrs-org/KE-complex_modifications/tree/master/docs/json)


[TOP](#top)
