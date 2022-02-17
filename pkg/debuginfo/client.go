// Copyright 2021 The Parca Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package debuginfo

import (
	"bufio"
	"context"
	"fmt"
	"io"

	"google.golang.org/grpc"

	debuginfopb "github.com/parca-dev/parca/gen/proto/go/parca/debuginfo/v1alpha1"
)

type Client struct {
	c debuginfopb.DebugInfoServiceClient
}

func NewDebugInfoClient(conn *grpc.ClientConn) *Client {
	return &Client{
		c: debuginfopb.NewDebugInfoServiceClient(conn),
	}
}

func (c *Client) Exists(ctx context.Context, buildID string) (bool, error) {
	res, err := c.c.Exists(ctx, &debuginfopb.ExistsRequest{
		BuildId: buildID,
	})
	if err != nil {
		return false, err
	}

	return res.Exists, nil
}

func (c *Client) Upload(ctx context.Context, buildID string, r io.Reader) (uint64, error) {
	stream, err := c.c.Upload(ctx)
	if err != nil {
		return 0, fmt.Errorf("initiate upload: %w", err)
	}

	err = stream.Send(&debuginfopb.UploadRequest{
		Data: &debuginfopb.UploadRequest_Info{
			Info: &debuginfopb.UploadInfo{
				BuildId: buildID,
			},
		},
	})
	if err != nil {
		return 0, fmt.Errorf("send upload info: %w", err)
	}

	reader := bufio.NewReader(r)
	buffer := make([]byte, 1024)

	bytesSent := 0
	for {
		n, err := reader.Read(buffer)
		if err == io.EOF {
			break
		}
		if err != nil {
			return 0, fmt.Errorf("read next chunk (%d bytes sent so far): %w", bytesSent, err)
		}

		err = stream.Send(&debuginfopb.UploadRequest{
			Data: &debuginfopb.UploadRequest_ChunkData{
				ChunkData: buffer[:n],
			},
		})
		if err != nil {
			return 0, fmt.Errorf("send next chunk (%d bytes sent so far): %w", bytesSent, err)
		}
		bytesSent += n
	}

	res, err := stream.CloseAndRecv()
	if err != nil {
		return 0, fmt.Errorf("close and receive: %w", err)
	}
	return res.Size, nil
}
