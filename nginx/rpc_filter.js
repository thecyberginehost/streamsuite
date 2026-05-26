function filterRPC(r) {
    try {
        var body = r.requestText || r.requestBody;
        if (!body) {
            r.return(400, JSON.stringify({jsonrpc:"2.0",error:{code:-32600,message:"empty request body"},id:null}));
            return;
        }

        var data;
        try {
            data = JSON.parse(body);
        } catch(e) {
            r.return(400, JSON.stringify({jsonrpc:"2.0",error:{code:-32700,message:"parse error"},id:null}));
            return;
        }

        // Handle batch requests
        var methods = [];
        if (Array.isArray(data)) {
            for (var i = 0; i < data.length; i++) {
                methods.push(data[i].method || "");
            }
        } else {
            methods.push(data.method || "");
        }

        // Blocked method prefixes
        var blocked = ["admin_", "personal_", "miner_", "clique_"];
        
        // Check tier from nginx variable
        var tier = r.variables.customer_tier || "realtime";

        // Record method(s) for access log — batch requests get joined
        r.variables.rpc_method = methods.length > 1 ? methods.join(",") : (methods[0] || "");

        for (var i = 0; i < methods.length; i++) {
            var m = methods[i].toLowerCase();
            
            // Always block admin/personal/miner
            for (var j = 0; j < blocked.length; j++) {
                if (m.indexOf(blocked[j]) === 0) {
                    r.return(403, JSON.stringify({
                        jsonrpc:"2.0",
                        error:{code:-32601, message:"method " + methods[i] + " is not available"},
                        id:null
                    }));
                    return;
                }
            }

            // Tier-based access control
            if (tier === "realtime") {
                // Block mempool and debug for realtime tier
                if (m.indexOf("txpool_") === 0 || m === "eth_pendingtransactions") {
                    r.return(403, JSON.stringify({
                        jsonrpc:"2.0",
                        error:{code:-32601, message:"method " + methods[i] + " requires Mempool tier or higher"},
                        id:null
                    }));
                    return;
                }
                if (m.indexOf("debug_") === 0) {
                    r.return(403, JSON.stringify({
                        jsonrpc:"2.0",
                        error:{code:-32601, message:"method " + methods[i] + " requires Full Node tier"},
                        id:null
                    }));
                    return;
                }
            }
            
            if (tier === "mempool") {
                // Block debug for mempool tier
                if (m.indexOf("debug_") === 0) {
                    r.return(403, JSON.stringify({
                        jsonrpc:"2.0",
                        error:{code:-32601, message:"method " + methods[i] + " requires Full Node tier"},
                        id:null
                    }));
                    return;
                }
            }
            // tier === "fullnode" gets everything

            // Public bench tier: only the SLA-covered hot-path methods.
            // Same methods customers can refund against. Read-only, cheap.
            if (tier === "bench_public") {
                var benchAllowed = [
                    "eth_blocknumber",
                    "eth_chainid",
                    "net_version",
                    "eth_call",
                    "eth_getbalance",
                    "eth_gettransactioncount",
                    "eth_gettransactionreceipt",
                    "eth_sendrawtransaction"
                ];
                if (benchAllowed.indexOf(m) === -1) {
                    r.return(403, JSON.stringify({
                        jsonrpc:"2.0",
                        error:{code:-32601, message:"method " + methods[i] + " not available on public bench tier — purchase a plan at https://streamsuite.io/pricing"},
                        id:null
                    }));
                    return;
                }
            }
        }

        // Passed all checks — proxy to geth
        r.internalRedirect("@geth_backend");
    } catch(e) {
        r.return(500, JSON.stringify({jsonrpc:"2.0",error:{code:-32603,message:"internal error"},id:null}));
    }
}

export default { filterRPC };
