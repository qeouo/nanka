set nobackup
set noswapfile
set clipboard+=unnamed
set cindent "新しい行のインデントを現在行と同じにする
set backupdir=$HOME/vimbackup "バックアップファイルを作るディレクトリ
set browsedir=buffer "ファイル保存ダイアログの初期ディレクトリをバッファファイル位置に設定
set nocompatible "Vi互換をオフ
set directory=$HOME/vimbackup "スワップファイル用のディレクトリ
set noexpandtab "タブの代わりに空白文字を挿入する
set hidden "変更中のファイルでも、保存しないで他のファイルを表示
set incsearch "インクリメンタルサーチを行う
set list "タブ文字、行末など不可視文字を表示する
set listchars=eol:<,tab:>\ "listで表示される文字のフォーマットを指定する
set number "行番号を表示する
set showmatch "閉じ括弧が入力されたとき、対応する括弧を表示する
set smartcase "検索時に大文字を含んでいたら大/小を区別
set cindent "新しい行を作ったときに高度な自動インデントを行う
set whichwrap=b,s,h,l,<,>,[,] "カーソルを行頭、行末で止まらないようにする
set nowrapscan "検索をファイルの先頭へループしない
set ignorecase

set tabstop=4
set shiftwidth=4
set tw=0

nmap <C-p> "+gP

nmap <C-t> :tabnew 
nmap <C-w> :bw <Enter>
"nnoremap <C-tab> gt
"nnoremap <C-S-tab> gT
map <C-tab> gt
map <C-S-tab> gT


"gvim
set guicursor=a:blinkon0
colorscheme evening




" 文字コードの自動認識
if &encoding !=# 'utf-8'
  set encoding=japan
  set fileencoding=japan
endif
if has('iconv')
  let s:enc_euc = 'euc-jp'
  let s:enc_jis = 'iso-2022-jp'
  " iconvがeucJP-msに対応しているかをチェック
  if iconv("\x87\x64\x87\x6a", 'cp932', 'eucjp-ms') ==# "\xad\xc5\xad\xcb"
    let s:enc_euc = 'eucjp-ms'
    let s:enc_jis = 'iso-2022-jp-3'
  " iconvがJISX0213に対応しているかをチェック
  elseif iconv("\x87\x64\x87\x6a", 'cp932', 'euc-jisx0213') ==# "\xad\xc5\xad\xcb"
    let s:enc_euc = 'euc-jisx0213'
    let s:enc_jis = 'iso-2022-jp-3'
  endif
  " fileencodingsを構築
  if &encoding ==# 'utf-8'
    let s:fileencodings_default = &fileencodings
    let &fileencodings = s:enc_jis .','. s:enc_euc .',cp932'
    let &fileencodings = &fileencodings .','. s:fileencodings_default
    unlet s:fileencodings_default
  else
    let &fileencodings = &fileencodings .','. s:enc_jis
    set fileencodings+=utf-8,ucs-2le,ucs-2
    if &encoding =~# '^\(euc-jp\|euc-jisx0213\|eucjp-ms\)$'
      set fileencodings+=cp932
      set fileencodings-=euc-jp
      set fileencodings-=euc-jisx0213
      set fileencodings-=eucjp-ms
      let &encoding = s:enc_euc
      let &fileencoding = s:enc_euc
    else
      let &fileencodings = &fileencodings .','. s:enc_euc
    endif
  endif
  " 定数を処分
  unlet s:enc_euc
  unlet s:enc_jis
endif
" 日本語を含まない場合は fileencoding に encoding を使うようにする
if has('autocmd')
  function! AU_ReCheck_FENC()
    if &fileencoding =~# 'iso-2022-jp' && search("[^\x01-\x7e]", 'n') == 0
      let &fileencoding=&encoding
    endif
  endfunction
  autocmd BufReadPost * call AU_ReCheck_FENC()
endif
" 改行コードの自動認識
set fileformats=unix,dos,mac
" □とか○の文字があってもカーソル位置がずれないようにする
if exists('&ambiwidth')
  set ambiwidth=double
endif



