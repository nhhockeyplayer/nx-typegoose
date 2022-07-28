rm -rf tmp
rm *lock*
rm -rf dist
rm -rf node_modules
npm install --legacy-peer-deps
nx run-many --all --target=build
nx run-many --all --target=post-distribution
cd dist/packages/typegoose
npm pack
cd ../../..

