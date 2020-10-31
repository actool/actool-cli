# actool-cli
Toolkit for code / comments actuality and relevance checking.

> **DISCLAIMER**: Work in process, and for a while - here is *approximate* description

## Table of contents

<!--ts-->
   * [Overview](#overview)
   * [Get started](#get-started)
      * [Installing](#installing)
      * [Usage example](#usage-example)
   * [Config](#config)
   * [Team](#team)
   * [FAQ](#faq)
   * [Plans](#plans)
<!--te-->

## Overview
> *"Code never lies, comments sometimes do." - Ron Jeffries*

Actool CLI provides tools **for validating comments** in code - *based on your config, code and commits history.*

Tool was conceived to solve following problems:
- Comments for code block *loses their actuality fastly* - during developing (becomes *irrelevant*)
```ts
/**
 * Get schedules from server
 */
 const getShared = async () => {
     const { data: schedules } = await API.getSchedules();
     const { data: vehicles } = await API.getVehicles();
     const { data: issueStatuses } = await API.getIssueStatuses();
 }
```
- Sometimes few parts of *code stay commented*. And after long time it might confuse you and your colleagues when you'll return to this block
```tsx
return (
    <div className="toolbar">
        <Button onClick={handleRefresh}>Refresh</Button>
        {/* <Button onClick={() => dispatch(deleteEntity()))}>Delete</Button> */}
        {/* <Button onClick={handleAdd}>Add</Button> */}
    </div>
)
```
- After a while of your projects started - *there are a lot of `fixme` / `todo` tags*, what hard to control and track during dev
```ts
// TODO: loading logic
// FIXME: temp logic, specify
// FIXME: invalid behaviour, fix later
```

## Get Started
> TODO: quick start with module (how it should be - by your opinion)

### Installing
> TODO: installing process (yarn + npm)

### Usage example
> TODO: quick usage example (import / require without custom config)

## Config
> TODO: customization for project (how it should be - by your opinion)

## Team
<table><tbody><tr>
  <td align="center" valign="top" width="11%">
    <a href="https://github.com/martis-git">
      <img src="https://github.com/martis-git.png?s=75" width="75" height="75"><br />
      Ilya Azin
    </a>
  </td>
  <td align="center" valign="top" width="11%">
    <a href="https://github.com/ural-2001">
      <img src="https://github.com/ural-2001.png?s=75" width="75" height="75"><br />
      Ural Ozbayan
    </a>
  </td>
  <td align="center" valign="top" width="11%">
    <a href="https://github.com/lyf2000">
      <img src="https://github.com/lyf2000.png?s=75" width="75" height="75"><br />
      Damir Nafikov
    </a>
  </td>
</tr></tbody></table>

## FAQ
> TODO: some specific cases / problems (how it should be - by your opinion)

## Future plans

### Variations
- MVP version for js (as script validator)
- NPM module version for js
- ESLint rule
- Version with precommit hook validating
- Version for other langs
- Version for IDEs (at start - as vscode extension)

### Functionality
- Check comments actuality (with validate triggering by related code changing)
- Control rubbish commented code (to reduce amount of unused commented and confusing logic)
- Control todo/fixme's progression (to regulate and normalize project backlog)
- Notifications for user (for manual checking confusing specified files)
