if [[ $(uname -s) =~ CYGWIN*|MINGW32*|MSYS*|MINGW* ]]; then
    clang -shared -g -O0 -o library.dll library.c
elif [ "$(uname)" == "Darwin" ]; then
    clang -shared -g -O0 -o library.so library.c 
elif [ "$(expr substr $(uname -s) 1 5)" == "Linux" ]; then
    clang -shared -g -O0 -o library.dylib library.c
fi