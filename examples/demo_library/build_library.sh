clang -c -o library.o library.c

if [[ $(uname -s) =~ CYGWIN*|MINGW32*|MSYS*|MINGW* ]]; then
  clang -shared -v -o library.dll library.o
else
  clang -shared -v -o liblibrary.dylib library.o
fi