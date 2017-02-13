set nobackup
set noswapfile
set clipboard+=unnamed
set cindent "$B?7$7$$9T$N%$%s%G%s%H$r8=:_9T$HF1$8$K$9$k(B
set backupdir=$HOME/vimbackup "$B%P%C%/%"%C%W%U%!%$%k$r:n$k%G%#%l%/%H%j(B
set browsedir=buffer "$B%U%!%$%kJ]B8%@%$%"%m%0$N=i4|%G%#%l%/%H%j$r%P%C%U%!%U%!%$%k0LCV$K@_Dj(B
set nocompatible "Vi$B8_49$r%*%U(B
set directory=$HOME/vimbackup "$B%9%o%C%W%U%!%$%kMQ$N%G%#%l%/%H%j(B
set noexpandtab "$B%?%V$NBe$o$j$K6uGrJ8;z$rA^F~$9$k(B
set hidden "$BJQ99Cf$N%U%!%$%k$G$b!"J]B8$7$J$$$GB>$N%U%!%$%k$rI=<((B
set incsearch "$B%$%s%/%j%a%s%?%k%5!<%A$r9T$&(B
set list "$B%?%VJ8;z!"9TKv$J$IIT2D;kJ8;z$rI=<($9$k(B
set listchars=eol:<,tab:>\ "list$B$GI=<($5$l$kJ8;z$N%U%)!<%^%C%H$r;XDj$9$k(B
set number "$B9THV9f$rI=<($9$k(B
set showmatch "$BJD$83g8L$,F~NO$5$l$?$H$-!"BP1~$9$k3g8L$rI=<($9$k(B
set smartcase "$B8!:w;~$KBgJ8;z$r4^$s$G$$$?$iBg(B/$B>.$r6hJL(B
set cindent "$B?7$7$$9T$r:n$C$?$H$-$K9bEY$J<+F0%$%s%G%s%H$r9T$&(B
set whichwrap=b,s,h,l,<,>,[,] "$B%+!<%=%k$r9TF,!"9TKv$G;_$^$i$J$$$h$&$K$9$k(B
set nowrapscan "$B8!:w$r%U%!%$%k$N@hF,$X%k!<%W$7$J$$(B
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




" $BJ8;z%3!<%I$N<+F0G'<1(B
if &encoding !=# 'utf-8'
  set encoding=japan
  set fileencoding=japan
endif
if has('iconv')
  let s:enc_euc = 'euc-jp'
  let s:enc_jis = 'iso-2022-jp'
  " iconv$B$,(BeucJP-ms$B$KBP1~$7$F$$$k$+$r%A%'%C%/(B
  if iconv("\x87\x64\x87\x6a", 'cp932', 'eucjp-ms') ==# "\xad\xc5\xad\xcb"
    let s:enc_euc = 'eucjp-ms'
    let s:enc_jis = 'iso-2022-jp-3'
  " iconv$B$,(BJISX0213$B$KBP1~$7$F$$$k$+$r%A%'%C%/(B
  elseif iconv("\x87\x64\x87\x6a", 'cp932', 'euc-jisx0213') ==# "\xad\xc5\xad\xcb"
    let s:enc_euc = 'euc-jisx0213'
    let s:enc_jis = 'iso-2022-jp-3'
  endif
  " fileencodings$B$r9=C[(B
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
  " $BDj?t$r=hJ,(B
  unlet s:enc_euc
  unlet s:enc_jis
endif
" $BF|K\8l$r4^$^$J$$>l9g$O(B fileencoding $B$K(B encoding $B$r;H$&$h$&$K$9$k(B
if has('autocmd')
  function! AU_ReCheck_FENC()
    if &fileencoding =~# 'iso-2022-jp' && search("[^\x01-\x7e]", 'n') == 0
      let &fileencoding=&encoding
    endif
  endfunction
  autocmd BufReadPost * call AU_ReCheck_FENC()
endif
" $B2~9T%3!<%I$N<+F0G'<1(B
set fileformats=unix,dos,mac
" $B""$H$+!{$NJ8;z$,$"$C$F$b%+!<%=%k0LCV$,$:$l$J$$$h$&$K$9$k(B
if exists('&ambiwidth')
  set ambiwidth=double
endif



