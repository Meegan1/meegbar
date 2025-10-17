local lspconfig = require("lspconfig")
lspconfig.ts_ls.setup({
	cmd = {
		"typescript-language-server",
		"--stdio",
	},
})

local overseer = require("overseer")

overseer.register_template({
	name = "Develop",
	builder = function()
		return {
			cmd = { "npm" },
			args = {
				"run",
				"dev",
			},
		}
	end,
})
