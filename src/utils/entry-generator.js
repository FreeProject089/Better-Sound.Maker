/**
 * entry-generator.js — Generate entry.lua for DCS mods
 */

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

    const safeModName = modName.replace(/"/g, '\\"');
    const safeAuthor = author.replace(/"/g, '\\"');
    const safeDesc = description.replace(/"/g, '\\"');
    const safeUrl = url.replace(/"/g, '\\"');
    const safeCredits = credits.replace(/"/g, '\\"');
    const safeDisplay = (displayName || modName).replace(/"/g, '\\"');
    const safeShort = (shortName || modName.substring(0, 4).toUpperCase()).replace(/"/g, '\\"');

    let lua = `-- Generated with DCS Better Sound.Maker
-- Credits: ${safeCredits || safeAuthor}
-- Version: ${version}

declare_plugin("${safeModName}",
    {
        installed   = true,
        dirName     = current_mod_path,
        version     = "${version}",
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
    }

    return lua;
}
