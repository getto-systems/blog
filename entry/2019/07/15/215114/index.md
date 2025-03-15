# vim で Elm language server をセットアップする
<a id="top"></a>

coc で language server を使用して補完などを実行できるようにする。
また ale を使用して elm-format を実行するようにする。

###### CONTENTS

1. [出来上がったもの](#outcome)
1. [インストールするもの](#install-plugins)
1. [vim-elm-syntax をインストールする](#install-vim-elm-syntax)
1. [coc.nvim をインストールする](#install-coc)
1. [ale をインストールする](#install-ale)
1. [まとめ](#postscript)
1. [参考資料](#reference)


###### ENVIRONMENTS

- Intel NUC で docker を動かしている : Docker version 18.09.7
- Mac からは ssh で接続
- neovim の入ったイメージを docker run して開発
- neovim : v0.3.1


<a id="outcome"></a>
### 出来上がったもの

coc.nvim 用の設定は以下のとおり。

```vim
" Use tab for trigger completion with characters ahead and navigate.
" Use command ':verbose imap <tab>' to make sure tab is not mapped by other plugin.
inoremap <silent><expr> <TAB>
      \ pumvisible() ? "\<C-n>" :
      \ <SID>check_back_space() ? "\<TAB>" :
      \ coc#refresh()
inoremap <expr><S-TAB> pumvisible() ? "\<C-p>" : "\<C-h>"

function! s:check_back_space() abort
  let col = col('.') - 1
  return !col || getline('.')[col - 1]  =~# '\s'
endfunction

" Remap keys for gotos
nmap <silent> ,d <Plug>(coc-definition)
nmap <silent> ,r <Plug>(coc-references)

" Use K to show documentation in preview window
nnoremap <silent> K :call <SID>show_documentation()<CR>

function! s:show_documentation()
  if (index(['vim','help'], &filetype) >= 0)
    execute 'h '.expand('<cword>')
  else
    call CocAction('doHover')
  endif
endfunction

nmap <silent> <space>F <Plug>(coc-format)
nmap <space>R <Plug>(coc-rename)

nnoremap <silent> <space>n :<C-u>CocList diagnostics<cr>
```

`:CocConfig` の設定例は以下のとおり。

```json
{
  "languageserver": {
    "elmLS": {
      "command": "node_modules/.bin/elm-language-server",
      "args": ["--stdio"],
      "filetypes": ["elm"],
      "rootPatterns": ["elm.json"],
      "initializationOptions": {
        "runtime": "node",
        "elmPath": "node_modules/.bin/elm",
        "elmFormatPath": "node_modules/.bin/elm-format",
        "elmTestPath": "node_modules/.bin/elm-test"
      }
    }
  },
  "coc.preferences.codeLens.enable": true
}
```

ale 用の設定は以下のとおり。

```vim
let g:ale_fix_on_save = 1
let g:ale_fixers = {
\   'elm': ['elm-format'],
\}
let g:ale_elm_format_executable = 'elm-format'
let g:ale_elm_format_options = '--yes --elm-version=0.19'
```


[TOP](#top)
<a id="install-plugins"></a>
### インストールするもの

基本的に [elm を vim で書く with language server](https://medium.com/@cappyzawa/elm%E3%82%92vim%E3%81%A7%E6%9B%B8%E3%81%8F-with-language-server-5d87e7d7b59b) を参考にしてセットアップした。

[elm-tooling/elm-vim : GitHub](https://github.com/elm-tooling/elm-vim) に、vim の開発に必要そうなプラグインの紹介がある。

この中から以下のものを選んでインストールした。

- [vim-elm-syntax](https://github.com/andys8/vim-elm-syntax)
- [neoclide/coc.nvim](https://github.com/neoclide/coc.nvim)
- [w0rp/ale](https://github.com/w0rp/ale)


[TOP](#top)
<a id="install-vim-elm-syntax"></a>
### vim-elm-syntax をインストールする

シンタックスハイライトは [vim-elm-syntax](https://github.com/andys8/vim-elm-syntax) を使用することにした。

これは [ElmCast/elm-vim](https://github.com/ElmCast/elm-vim) のフォークで、シンタックスハイライトとインデント以外の機能を削除したもの。

プラグインは [Shougo/dein.vim](https://github.com/Shougo/dein.vim) で管理している。
設定例は以下のとおり。

```toml
[[plugins]]
repo = 'andys8/vim-elm-syntax'
on_ft = ['elm']
```

[TOP](#top)
<a id="install-coc"></a>
### coc.nvim をインストールする

language server protocol のサポートのために、[neoclide/coc.nvim](https://github.com/neoclide/coc.nvim) をインストールする。

[dein.vim](https://github.com/Shougo/dein.vim) の設定例は以下のとおり。
`repo` の設定を `release` にする必要があることに注意。

```toml
[[plugins]]
repo = 'neoclide/coc.nvim'
rev = "release"
hook_add = '''
" Use tab for trigger completion with characters ahead and navigate.
" Use command ':verbose imap <tab>' to make sure tab is not mapped by other plugin.
inoremap <silent><expr> <TAB>
      \ pumvisible() ? "\<C-n>" :
      \ <SID>check_back_space() ? "\<TAB>" :
      \ coc#refresh()
inoremap <expr><S-TAB> pumvisible() ? "\<C-p>" : "\<C-h>"

function! s:check_back_space() abort
  let col = col('.') - 1
  return !col || getline('.')[col - 1]  =~# '\s'
endfunction

" Remap keys for gotos
nmap <silent> ,d <Plug>(coc-definition)
nmap <silent> ,r <Plug>(coc-references)

" Use K to show documentation in preview window
nnoremap <silent> K :call <SID>show_documentation()<CR>

function! s:show_documentation()
  if (index(['vim','help'], &filetype) >= 0)
    execute 'h '.expand('<cword>')
  else
    call CocAction('doHover')
  endif
endfunction

nmap <silent> <space>F <Plug>(coc-format)
nmap <space>R <Plug>(coc-rename)

nnoremap <silent> <space>n :<C-u>CocList diagnostics<cr>
'''
```

`hook_add` に、[coc.nvim の設定例](https://github.com/neoclide/coc.nvim#example-vim-configuration)に書いてあるものをいくつか選んで設定した。

coc.nvim は現時点で nodejs のバージョン 10 が必要。
これは nvim が動いているイメージに含まれている必要がある。
docker run でラップしたものを参照させたらうまくいかなかった。

ちなみに、nvim をインストールすると python もインストールされるので、イメージが汚れる的な心配はすでに意味がない。

coc.nvim をインストールしたら、`:CocConfig` で language server の設定を行う。

```json
{
  "languageserver": {
    "elmLS": {
      "command": "node_modules/.bin/elm-language-server",
      "args": ["--stdio"],
      "filetypes": ["elm"],
      "rootPatterns": ["elm.json"],
      "initializationOptions": {
        "runtime": "node",
        "elmPath": "node_modules/.bin/elm",
        "elmFormatPath": "node_modules/.bin/elm-format",
        "elmTestPath": "node_modules/.bin/elm-test"
      }
    }
  },
  "coc.preferences.codeLens.enable": true
}
```

この設定を使用する場合、ローカルに `elm`・`elm-format`・`elm-test`・`elm-language-server` をインストールしておく必要がある。


[TOP](#top)
<a id="install-ale"></a>
### ale をインストールする

coc で保存時に format をかける方法がわからなかったので、[w0rp/ale](https://github.com/w0rp/ale) もインストールすることにした。

[dein.vim](https://github.com/Shougo/dein.vim) の設定例は以下のとおり。

```toml
[[plugins]]
repo = 'w0rp/ale'
hook_add = '''
let g:ale_fix_on_save = 1
let g:ale_fixers = {
\   'elm': ['elm-format'],
\}
let g:ale_elm_format_executable = 'elm-format'
let g:ale_elm_format_options = '--yes --elm-version=0.19'
'''
```

これで保存時に `elm-format` が走ってくれる。


[TOP](#top)
<a id="postscript"></a>
### まとめ

これで elm を vim で開発する環境が強化された。

本当は VSCode でやりたかったのだけれど、別なマシンで docker を動かしている関係でうまくいかなかった。
Docker プラグインに docker.host の設定が入ったようなので、今後うまくできるようになることを期待している。


[TOP](#top)
<a id="reference"></a>
### 参考資料

- [Langserver.org](https://langserver.org/)
- [elm を vim で書く with language server](https://medium.com/@cappyzawa/elm%E3%82%92vim%E3%81%A7%E6%9B%B8%E3%81%8F-with-language-server-5d87e7d7b59b)
- [elm-tooling/elm-vim : GitHub](https://github.com/elm-tooling/elm-vim)


[TOP](#top)
