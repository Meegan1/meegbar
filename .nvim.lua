vim.lsp.config.ts_ls.setup({
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

overseer.register_template({
	name = "Generate Types",
	builder = function()
		return {
			cmd = { "ags" },
			args = {
				"types",
				"-u",
				"-d",
				".",
			},
		}
	end,
})
