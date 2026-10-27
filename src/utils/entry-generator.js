/**
 * entry-generator.js — Generate entry.lua for DCS mods
 */

/** Escape text for a double-quoted Lua string literal. */
export function luaString(value) {
    return String(value ?? '')
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\r/g, '\\r')
        .replace(/\n/g, '\\n')
        .replace(/\t/g, '\\t')
        // Other control characters as decimal escapes (\ddd)
        .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, (c) => '\\' + String(c.charCodeAt(0)).padStart(3, '0'));
}

/** Keep a value on one `--` comment line (a newline would turn the rest into code). */
function luaComment(value) {
    return String(value ?? '').replace(/[\r\n]+/g, ' ');
}

export function generateEntryLua(config) {
    const {
        modName = 'SoundMod',
        author = 'Unknown',
        version = '1.0.0',
        description = '',
        url = '',
        credits = '',
        displayName = '',
        shortName = '',
        themeEnabled = false
    } = config;

    const safeModName = luaString(modName);
    const safeAuthor = luaString(author);
    const safeDesc = luaString(description);
    const safeUrl = luaString(url);
    const safeVersion = luaString(version);
    const safeDisplay = luaString(displayName || modName);
    const safeShort = luaString(shortName || modName.substring(0, 4).toUpperCase());

    let lua = `--------------------------------------------------------------------------------
--  Generated with Better ModMaker
--  Mod: ${luaComment(displayName || modName)}
--  Version: ${luaComment(version)}
--  Author: ${luaComment(credits || author)}
--------------------------------------------------------------------------------

declare_plugin("${safeModName}",
    {
        installed   = true,
        dirName     = current_mod_path,
        version     = "${safeVersion}",
        state       = "installed",
        developer   = "${safeAuthor}",
        description = "${safeDesc}",`;

    if (safeUrl) {
        lua += `
        fileRepoUrl = "${safeUrl}",`;
    }

    lua += `
        
        -- Module Info
        displayName = "${safeDisplay}",
        shortName   = "${safeShort}",

        type        = "Tech",`;

    if (themeEnabled) {
        lua += `

        Skins       =
        {
            {
                name = "${safeModName}",
                dir  = "Theme"
            },
        },`;
    } else {
        lua += `

        -- Skins       =
        -- {
        --     {
        --         name = "${safeModName}",
        --         dir  = "Theme"
        --     },
        -- },`;
    }

    lua += `
        Missions    = nil,
        Logbook     = nil,
        Options     = nil,
    })

-- Mount sound files into DCS virtual filesystem
mount_vfs_sound_path(current_mod_path .. "/Sounds")
`;

    if (themeEnabled) {
        lua += `
-- Mount theme textures
mount_vfs_texture_path(current_mod_path .. "/Theme/ME")
`;
    } else {
        lua += `
-- Mount theme textures (Disabled)
-- mount_vfs_texture_path(current_mod_path .. "/Theme/ME")
`;
    }

    return lua;
}
