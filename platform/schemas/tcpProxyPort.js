import mongoose from "mongoose";

/**
 * Keeps track of the used tcp proxy port numbers
 */
export const TCPProxyPortModel = mongoose.model(
	"tcp_proxy_port",
	new mongoose.Schema(
		{
			port: {
				type: Number,
				index: true,
			},
			__v: {
				type: Number,
				select: false,
			},
		},
		{ timestamps: true }
	)
);
