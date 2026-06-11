---
title: OCI 仕様
date: 2025-12-02
update: 2025-12-02
draft: false
tags:
  - Container
  - Open Container Initiative
description: Open Container Initiative の Image Spec を中心にコンテナ仕様を整理する。
---
- OCI (Open Container Initiative)にて標準化された仕様として，以下の3つがある
	- **OCI Image-spec**
		- https://github.com/opencontainers/image-spec/blob/main/spec.md
		- コンテナイメージの構造を定義
		- 定義された形式でコンテナをビルドする
	- **OCI Distribution-spec**
		- https://github.com/opencontainers/distribution-spec/blob/main/spec.md
		- コンテナイメージの配布方法を指定
		- 標準化されたHTTP APIを使用してリポジトリと対話できるようにする
	- **OCI Runtime-spec**
		- https://github.com/opencontainers/runtime-spec/blob/main/spec.md
		- コンテナランタイムの標準を定義
		- ライフサイクルの管理と実行を保証
		- 定義に従って，ダウンロードしたイメージを解凍して実行

## OCI Image-spec
- イメージの構造を定義し，以下のようなものを含んでいる

- **Image Manifest**
	- イメージのコンポーネントを記述するメタデータファイル
	- `docker manifest inspect`コマンドで見ることができる

```bash
❯ docker manifest inspect nginx:latest
{
   "schemaVersion": 2,
   "mediaType": "application/vnd.oci.image.index.v1+json",
   "manifests": [
      {
         "mediaType": "application/vnd.oci.image.manifest.v1+json",
         "size": 2290,
         "digest": "sha256:5c733364e9a8f7e6d7289ceaad623c6600479fe95c3ab5534f07bfd7416d9541",
         "platform": {
            "architecture": "amd64",
            "os": "linux"
         }
      },
      {
         "mediaType": "application/vnd.oci.image.manifest.v1+json",
         "size": 841,
         "digest": "sha256:af320b2df7e2bde33bd04165a7cad0b510f6ce6461d8f2e9c906fc77f99a8d21",
         "platform": {
            "architecture": "unknown",
            "os": "unknown"
         }
      },
      {
         "mediaType": "application/vnd.oci.image.manifest.v1+json",
         "size": 2292,
         "digest": "sha256:62225d274171ff35162681fac1069e005db7bef4bb991d5dadb61d6fc87c9a19",
         "platform": {
            "architecture": "arm",
            "os": "linux",
            "variant": "v5"
         }
      },
      {
         "mediaType": "application/vnd.oci.image.manifest.v1+json",
         "size": 841,
         "digest": "sha256:95f06ee8444e01fbfdf432b2b37bcc17efda81059415300bb70235ad4516aa55",
         "platform": {
            "architecture": "unknown",
            "os": "unknown"
         }
      },
      {
         "mediaType": "application/vnd.oci.image.manifest.v1+json",
         "size": 2292,
         "digest": "sha256:bead225e6794863c992c4c3214e7069f3dbde7e2e3fb03c462499e7c87b678a7",
         "platform": {
            "architecture": "arm",
            "os": "linux",
            "variant": "v7"
         }
      },
      {
         "mediaType": "application/vnd.oci.image.manifest.v1+json",
         "size": 841,
         "digest": "sha256:24cd250db1cde67fce0ce895700b076b719de887b107651fdbc1cb054dc4e967",
         "platform": {
            "architecture": "unknown",
            "os": "unknown"
         }
      },
      {
         "mediaType": "application/vnd.oci.image.manifest.v1+json",
         "size": 2292,
         "digest": "sha256:7de350c1fbb1f7b119a1d08f69fef5c92624cb01e03bc25c0ae11072b8969712",
         "platform": {
            "architecture": "arm64",
            "os": "linux",
            "variant": "v8"
         }
      },
      {
         "mediaType": "application/vnd.oci.image.manifest.v1+json",
         "size": 841,
         "digest": "sha256:82902e3d23a38265fe3ceb22da1f673a962d11acb40777a671d0a0e65ec7b7fb",
         "platform": {
            "architecture": "unknown",
            "os": "unknown"
         }
      },
      {
         "mediaType": "application/vnd.oci.image.manifest.v1+json",
         "size": 2289,
         "digest": "sha256:1b8fdfa2a4116c8b19322133670b1feba5b8ffdbdd31f5437296a4a16dd94cb8",
         "platform": {
            "architecture": "386",
            "os": "linux"
         }
      },
      {
         "mediaType": "application/vnd.oci.image.manifest.v1+json",
         "size": 841,
         "digest": "sha256:74dff7038a51bfb01eab538dbcec85c0f78e9cda415adf751417009111cf96d5",
         "platform": {
            "architecture": "unknown",
            "os": "unknown"
         }
      },
      {
         "mediaType": "application/vnd.oci.image.manifest.v1+json",
         "size": 2292,
         "digest": "sha256:a4f9edd24727204b0313b7e6df93bea94b161d29310831df463a2294560064c8",
         "platform": {
            "architecture": "ppc64le",
            "os": "linux"
         }
      },
      {
         "mediaType": "application/vnd.oci.image.manifest.v1+json",
         "size": 841,
         "digest": "sha256:3c8658e7455c4b5fa268c6b7fc3073804b008a774245ea938708675b0ab99e19",
         "platform": {
            "architecture": "unknown",
            "os": "unknown"
         }
      },
      {
         "mediaType": "application/vnd.oci.image.manifest.v1+json",
         "size": 2292,
         "digest": "sha256:2eca83f563c1b416ec37c092ec3f3903cf17aae8ce65305f1ad219a4e3024231",
         "platform": {
            "architecture": "riscv64",
            "os": "linux"
         }
      },
      {
         "mediaType": "application/vnd.oci.image.manifest.v1+json",
         "size": 841,
         "digest": "sha256:3d7cc40ee7ce57cc7afc48ef305e0f3d897581d7e2f9ab9e3876635d727bd886",
         "platform": {
            "architecture": "unknown",
            "os": "unknown"
         }
      },
      {
         "mediaType": "application/vnd.oci.image.manifest.v1+json",
         "size": 2290,
         "digest": "sha256:0f5d5e7cf211bdc68fb55f67b51e2943533c12da7f4f042d1952b25c76798f6d",
         "platform": {
            "architecture": "s390x",
            "os": "linux"
         }
      },
      {
         "mediaType": "application/vnd.oci.image.manifest.v1+json",
         "size": 841,
         "digest": "sha256:7e5106e1757af2683cd6aba1b2346eb00f66ebac6cd23767870a51e8f152cdf4",
         "platform": {
            "architecture": "unknown",
            "os": "unknown"
         }
      }
   ]
}
```

- Filesystem Layer
	- イメージを形成するためにスタックされるレイヤ
	- 各レイヤはファイルシステムに対する増分変更を表す
- Image Configuration
	- 環境変数，起動コマンド，作業ディレクトリなどを記述する構成ファイル

```bash
❯ docker image inspect nginx:latest
[
    {
        "Id": "sha256:60adc2e137e757418d4d771822fa3b3f5d3b4ad58ef2385d200c9ee78375b6d5",
        "RepoTags": [
            "nginx:latest"
        ],
        "RepoDigests": [
            "nginx@sha256:553f64aecdc31b5bf944521731cd70e35da4faed96b2b7548a3d8e2598c52a42"
        ],
        "Parent": "",
        "Comment": "buildkit.dockerfile.v0",
        "Created": "2025-11-18T04:24:11.258715718Z",
        "ContainerConfig": {
            "Hostname": "",
            "Domainname": "",
            "User": "",
            "AttachStdin": false,
            "AttachStdout": false,
            "AttachStderr": false,
            "Tty": false,
            "OpenStdin": false,
            "StdinOnce": false,
            "Env": null,
            "Cmd": null,
            "Image": "",
            "Volumes": null,
            "WorkingDir": "",
            "Entrypoint": null,
            "OnBuild": null,
            "Labels": null
        },
        "DockerVersion": "",
        "Author": "",
        "Architecture": "amd64",
        "Os": "linux",
        "Size": 151863538,
        "VirtualSize": 151863538,
        "GraphDriver": {
            "Data": {
                "LowerDir": "/var/lib/docker/overlay2/411020b9df19e8d3729eb593643837db8fe4691f9b2674dbbaf38aeddecbdc06/diff:/var/lib/docker/overlay2/9716d706f5ac71a413606be6b1d792af74f406746e9bc04cc48a4c96e034ed62/diff:/var/lib/docker/overlay2/1d9cbccdf922bb2768aef84a8efae44be04d24b737714edad9cdaa72d7826015/diff:/var/lib/docker/overlay2/58dc28599021ddc740750afa1daba3f11b7f7a00218c6abef5d6b4f74731497e/diff:/var/lib/docker/overlay2/03d9e3d91beaa98f1ffea80fffb9ae7817fd1374b6e28d1202451313ecff6e7c/diff:/var/lib/docker/overlay2/fc336caffe222381c6d2b125dbde4d0cb10da2502e573eee4eabc196640ee42d/diff",
                "MergedDir": "/var/lib/docker/overlay2/a8e54c820b52013f50006a7e7fac97e3868a8d510966d7c9bb2018c38fb4e1d4/merged",
                "UpperDir": "/var/lib/docker/overlay2/a8e54c820b52013f50006a7e7fac97e3868a8d510966d7c9bb2018c38fb4e1d4/diff",
                "WorkDir": "/var/lib/docker/overlay2/a8e54c820b52013f50006a7e7fac97e3868a8d510966d7c9bb2018c38fb4e1d4/work"
            },
            "Name": "overlay2"
        },
        "RootFS": {
            "Type": "layers",
            "Layers": [
                "sha256:70a290c5e58b68f39496ab93a62f21b8b2ca0502e97905131838de1b39a37cbb",
                "sha256:008ba900efa19180f53a0ed13fc6feb7d2d34bad25a839702024f87c5122568a",
                "sha256:1e79db1a7c1e2dc46e0cb975b22d67695877d42318a3598d01f322df3078c43d",
                "sha256:fe0771a36433cf0ef9f598e1f0b526520fa60c732d969e67bc6dd38f01bebf40",
                "sha256:5f0d4d15245b8979efd5be5e1726e44dd6461c32c2fa193b15228e591f1d2442",
                "sha256:388bb4cadb9eb18529d3f466855a783f38c821571bc180fec9d0663fef1d0322",
                "sha256:38d44e06fd0163071bcf2eeff92083e9420f4fb17c32fb5c4af71b75e0e91eaa"
            ]
        },
        "Metadata": {
            "LastTagTime": "0001-01-01T00:00:00Z"
        },
        "Config": {
            "AttachStderr": false,
            "AttachStdin": false,
            "AttachStdout": false,
            "Cmd": [
                "nginx",
                "-g",
                "daemon off;"
            ],
            "Domainname": "",
            "Entrypoint": [
                "/docker-entrypoint.sh"
            ],
            "Env": [
                "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
                "NGINX_VERSION=1.29.3",
                "NJS_VERSION=0.9.4",
                "NJS_RELEASE=1~trixie",
                "PKG_RELEASE=1~trixie",
                "DYNPKG_RELEASE=1~trixie"
            ],
            "ExposedPorts": {
                "80/tcp": {}
            },
            "Hostname": "",
            "Image": "",
            "Labels": {
                "maintainer": "NGINX Docker Maintainers \u003cdocker-maint@nginx.com\u003e"
            },
            "OnBuild": null,
            "OpenStdin": false,
            "StdinOnce": false,
            "StopSignal": "SIGQUIT",
            "Tty": false,
            "User": "",
            "Volumes": null,
            "WorkingDir": ""
        }
    }
]
```


## 参照リンク
- https://medium.com/@rifewang/oci-introduction-the-full-journey-from-code-to-container-in-a-kubernetes-environment-1e36d2890ca5
