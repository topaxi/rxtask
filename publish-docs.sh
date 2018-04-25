#!/usr/bin/env sh
#
# Generates documentation and pushes it up to the site
# WARNING: Do NOT run this script unless you have remote `upstream` set properly
#
rm -rf tmp/docs && \
  yarn && \
  yarn docs:build && \
  git checkout gh-pages && \
  git fetch upstream && \
  git rebase upstream/gh-pages && \
  cp -r ./tmp/docs/* ./ && \
  rm -rf tmp/ node_modules/ dist/ #&& \
  git add . && \
  git commit -m "chore(docs): docs generated automatically" && \
  git push upstream gh-pages
