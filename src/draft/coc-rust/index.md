# coc.nvim で Rust Language Server する
<a id="top"></a>

vim で Rust するときの設定をまとめる。

###### CONTENTS

1. [出来上がったもの](#outcome)
1. [rust.vim のインストール](#install-rust-vim)
1. [必要なコンポーネントのインストール](#install-rust-components)
1. [CocConfig の設定](#setup-coc)
1. [ALE の設定](#setup-ale)
1. [まとめ](#postscript)
1. [参考資料](#reference)


###### ENVIRONMENTS

- NVIM v0.3.8
- [rust.vim : GitHub](https://github.com/rust-lang/rust.vim)
- [coc.nvim : GitHub](https://github.com/neoclide/coc.nvim)
- [ale : GitHub](https://github.com/dense-analysis/ale)


<a id="outcome"></a>
### 出来上がったもの

rust.vim の設定。

```toml
[[plugins]]
repo = 'rust-lang/rust.vim'
hook_add = '''
let g:rustfmt_autosave = 0
'''
on_ft = ['rust']
```

必要なコンポーネントのインストール。

```bash
rustup component add rls rust-analysis rust-src
```

CocConfig の rust 用設定。

```json
{
  "languageserver": {
    "rust": {
      "command": "rustup",
      "args": ["run", "stable", "rls"],
      "filetypes": ["rust"]
    }
  }
}
```

ALE による、保存後の整形の設定。

```toml
[[plugins]]
repo = 'w0rp/ale'
hook_add = '''
let g:ale_fix_on_save = 1
let g:ale_fixers = {
\   'rust': ['rustfmt'],
\}
let g:ale_rustfmt_executable = 'rustfmt'
'''
```


[TOP](#top)
<a id="install-rust-vim"></a>
### rust.vim のインストール

基本的なプラグインとして rust.vim をインストールしておく。
以下は dein の設定内容。

```toml
[[plugins]]
repo = 'rust-lang/rust.vim'
hook_add = '''
let g:rustfmt_autosave = 0
'''
on_ft = ['rust']
```

保存後の整形は ALE に任せるので、`g:rustfmt_autosave = 0` に設定しておく。

というよりも、rust.vim から rustfmt をうまく呼びだせず、この設定を off にしていたことを思い出した。
rust.vim から rustfmt できるなら、ALE の設定は必要ない。

- Rust をいじっていた時期を振り返ってみたらもう１年か…


[TOP](#top)
<a id="install-rust-components"></a>
### 必要なコンポーネントのインストール

Language Server として、[rust-lang/rls : GitHub](https://github.com/rust-lang/rls) を使用する。
README によれば、`rls`、`rust-analysis`、`rust-src` が必要。

```bash
rustup component add rls rust-analysis rust-src
```


[TOP](#top)
<a id="setup-coc"></a>
### CocConfig の設定

Language Server の起動には coc.nvim を使用している。
`:CocConfig` に以下の設定を追加する。

```json
{
  "languageserver": {
    "rust": {
      "command": "rustup",
      "args": ["run", "stable", "rls"],
      "filetypes": ["rust"]
    }
  }
}
```

これで補完が効くようになれば成功。


[TOP](#top)
<a id="setup-ale"></a>
### ALE の設定

保存後の整形は ALE で行なっている。

```toml
[[plugins]]
repo = 'w0rp/ale'
hook_add = '''
let g:ale_fix_on_save = 1
let g:ale_fixers = {
\   'rust': ['rustfmt'],
\}
let g:ale_rustfmt_executable = 'rustfmt'
'''
```

rust.vim で rustfmt にアクセスできれば、この設定は必要ないはず。


[TOP](#top)
<a id="postscript"></a>
### まとめ

vim で rust するときの設定をまとめた。

Language Server の力は偉大。


[TOP](#top)
<a id="reference"></a>
### 参考資料

- [rust-lang/rust.vim : GitHub](https://github.com/rust-lang/rust.vim)
- [rust-lang/rls : GitHub](https://github.com/rust-lang/rls)
- [neoclide/coc.nvim : GitHub](https://github.com/neoclide/coc.nvim)
- [dense-analysis/ale : GitHub](https://github.com/dense-analysis/ale)


[TOP](#top)
