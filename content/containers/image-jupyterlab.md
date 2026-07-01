---
title: JupyterLab コンテナイメージ
date: 2025-12-28
modified: 2025-12-28
draft: false
tags:
  - containers/docker
aliases:
  - notes/image-jupyterlab
  - memos/containers/image-jupyterlab
description: Python slim イメージ上で JupyterLab を起動する手順の証跡。
---

## 証跡

```
→ docker run --rm -it python:3.11-slim /bin/bash

root@061ac190dbab:/# pip install --upgrade pip
root@061ac190dbab:/# pip install jupyterlab
root@061ac190dbab:/# jupyter lab --ip=0.0.0.0 --allow-root
...
    To access the server, open this file in a browser:
        file:///root/.local/share/jupyter/runtime/jpserver-64-open.html
    Or copy and paste one of these URLs:
        http://localhost:8888/lab?token=xxxxxxxxxxxxxxxxxx
        http://127.0.0.1:8888/lab?token=xxxxxxxxxxxxxxxxxx

docker run --rm -it \
  --publish 8888:8888 \
  --volume $(pwd):/work \
  --workdir /work \
  python:3.11-slim /bin/bash
```

## 参照リンク

-
