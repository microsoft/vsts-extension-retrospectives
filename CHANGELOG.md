# Changelog

You can find the changelog of the Retrospective Extension below.

## v1.92.59

* Added a "Move Everyone" control so board managers can move all participants to the selected retrospective phase. From [GitHub PR #1836](https://github.com/microsoft/vsts-extension-retrospectives/pull/1836)
* Expanded feedback search to include archived boards. From [GitHub PR #1834](https://github.com/microsoft/vsts-extension-retrospectives/pull/1834)
* Improved keyboard navigation and accessibility for retrospective phase tabs. From [GitHub PR #1837](https://github.com/microsoft/vsts-extension-retrospectives/pull/1837)
* Fixed a Focus Mode render loop that could cause constant CPU usage. From [GitHub PR #1838](https://github.com/microsoft/vsts-extension-retrospectives/pull/1838)
* Optimized board, permission, workflow-stage, and Team Assessment History rendering to reduce unnecessary updates. From [GitHub PR #1840](https://github.com/microsoft/vsts-extension-retrospectives/pull/1840)
* Improved the board settings dialog layout and accessibility, including dialog sizing and tab structure. From [GitHub PR #1833](https://github.com/microsoft/vsts-extension-retrospectives/pull/1833)
* Refined board settings inputs, selector options, and tooltip positioning for a more consistent interface. From [GitHub PR #1841](https://github.com/microsoft/vsts-extension-retrospectives/pull/1841)
* Restricted editing of retrospective settings to the Board Owner or a Team Admin.
* Added a view-only retrospective settings experience for other users, including updated board menu text, dialog messaging, and disabled editing controls.
* Fixed bug that prevented saving retrospective settings from the Permissions tab.
* Hardened frontend CI/CD pipeline by retrying publish once on transient failure.

From [GitHub PR #1846](https://github.com/microsoft/vsts-extension-retrospectives/pull/1846)

* Addressed legacy icon mapping gaps or misalignment and replaced remaining Font Awesome icons.
* Replaced filled icons with outlined versions for the help menu.
* Added new icons for the Speedboat template and swapped several icons used in other templates.
* Replaced and rearranged icons available in the "Choose icon" selection tray.

From [GitHub PR #1835](https://github.com/microsoft/vsts-extension-retrospectives/pull/1835)

* Refactored icon definitions separating legacy alias resolution from selection tray behavior.
* Edited icon selection tray adjusting display order and removing 7 lower value icons.
* Closed test code coverage gaps.

From [GitHub PR #1832](https://github.com/microsoft/vsts-extension-retrospectives/pull/1832)

## v1.92.58

* Improved team and board loading error handling, including default-team lookup and recovery when browser local-network access restrictions blocked team configuration. From [GitHub PR #1817](https://github.com/microsoft/vsts-extension-retrospectives/pull/1817), [GitHub PR #1818](https://github.com/microsoft/vsts-extension-retrospectives/pull/1818), and [GitHub PR #1826](https://github.com/microsoft/vsts-extension-retrospectives/pull/1826)
* Fixed retrospective board links for Azure DevOps organizations in the Pakistan region. From [GitHub PR #1819](https://github.com/microsoft/vsts-extension-retrospectives/pull/1819)
* Increased the allowed length of retrospective column titles. From [GitHub PR #1820](https://github.com/microsoft/vsts-extension-retrospectives/pull/1820)
* Added sort-direction icons to sortable Board Summary table headers. From [GitHub PR #1822](https://github.com/microsoft/vsts-extension-retrospectives/pull/1822)
* Reorganized board settings and permissions into tabs. From [GitHub PR #1813](https://github.com/microsoft/vsts-extension-retrospectives/pull/1813)
* Added contextual tooltips for column names and notes, team selection, timer controls, Focus Mode, settings, and Team Assessment History. From [GitHub PR #1825](https://github.com/microsoft/vsts-extension-retrospectives/pull/1825)
* Improved board permission management with team search and select-all controls. From [GitHub PR #1825](https://github.com/microsoft/vsts-extension-retrospectives/pull/1825)
* Removed rarely used Good-to-Done retrospective template. From [GitHub PR #1845](https://github.com/microsoft/vsts-extension-retrospectives/pull/1845)

## v1.92.57

* Fixed double scrollbar behavior in the Create email summary dialog at higher zoom levels. From [GitHub PR #1816](https://github.com/microsoft/vsts-extension-retrospectives/pull/1816)
* Extended permissions so board owners and team admins can update column notes and edit or delete feedback cards. From [GitHub PR #1805](https://github.com/microsoft/vsts-extension-retrospectives/pull/1805)
* Improved hidden feedback behavior so screen displays blurred feedback and screen reader announces "feedback blurred". From [GitHub PR #1796](https://github.com/microsoft/vsts-extension-retrospectives/pull/1796)
* Updated toast rendering so notifications appear within the topmost open dialog. From [GitHub PR #1794](https://github.com/microsoft/vsts-extension-retrospectives/pull/1794)
* Fixed Copy to clipboard behavior for the email summary experience. From [GitHub PR #1793](https://github.com/microsoft/vsts-extension-retrospectives/pull/1793)
* Added release-promotion guidelines documentation to support consistent release workflows. From [GitHub PR #1792](https://github.com/microsoft/vsts-extension-retrospectives/pull/1792)

## v1.92.56

* Introduced Admin Settings with an option to configure available work item types for "Add work item".
* Set available work item types to default to Requirement Backlog types for both the Act tab and Focus mode.
* Fixed Link existing work item in Focus mode so it stays in Focus mode instead of returning to Act tab.
* Refined the "Add work item" selection to ensure the full work item list is visible on the Act tab and Focus mode.
* Fixed issues with Focus mode sorting and Act tab sorting.
* Fixed Act tab feedback item numbering to be consistent with other tabs.

From [GitHub PR #1777](https://github.com/microsoft/vsts-extension-retrospectives/pull/1777)

* Updated changelog and what's new to reflect current version updates and untangled changelog for prior two versions. From [GitHub PR #1783](https://github.com/microsoft/vsts-extension-retrospectives/pull/1783)
* Introduced user setting with an option to toggle between scrolling by board or by column. From [GitHub PR #1780](https://github.com/microsoft/vsts-extension-retrospectives/pull/1780)

## v1.92.55

* Added function to search feedback across all boards for the current team. From [GitHub PR #1774](https://github.com/microsoft/vsts-extension-retrospectives/pull/1774)
* Restricted editing and deleting a feedback card to the user who created it or the board owner, so participants can no longer modify or remove other people's cards. From [GitHub PR #1772](https://github.com/microsoft/vsts-extension-retrospectives/pull/1772)
* Resolved race conditions on initial load which could result in missing teams or boards. From [GitHub PR #1766](https://github.com/microsoft/vsts-extension-retrospectives/pull/1766)
* Isolated What's New for simpler maintenance and updated Changelog history. From [GitHub PR #1753](https://github.com/microsoft/vsts-extension-retrospectives/pull/1753)

## v1.92.54

* Ensured editing a retrospective updates the intended board name and prevents accidental renames.
* Prevented duplicate-name side effects that can impact board retrieval when updating board metadata.
* Improved Create and Edit Retrospective dialog name-validation feedback, including consistent validation messaging for missing or duplicate board name.
* Simplified board-configuration wording in Board Settings, including the required-name indicator, Max Votes label, and hidden feedback option.
* Reintroduced borders for user input fields for cleaner visuals.
* Fixed a regression introduced during metadata dialog updates where selecting a column icon could close the parent Create or Edit dialog and discard in-progress changes.
* Aligned dialog title styling across Create, Copy, Edit, Archive, and Summary experiences for a more consistent visual experience.
* Added support for small, medium, large and extra large standard dialog widths.
* Reverted dialog backdrop styling from blurred background to shaded background for better context visibility and consistency with ADO.
* Addressed remaining test code coverage gaps so now at 100%.

From [GitHub PR #1728](https://github.com/microsoft/vsts-extension-retrospectives/pull/1728) and [GitHub PR #1723](https://github.com/microsoft/vsts-extension-retrospectives/pull/1723)

* Enhanced validation and error handling for retrospective title input. From [GitHub PR #1740](https://github.com/microsoft/vsts-extension-retrospectives/pull/1740)
* Improved live-sync scoping when switching teams or boards so updates followed the currently selected retrospective context. From [GitHub PR #1678](https://github.com/microsoft/vsts-extension-retrospectives/pull/1678)

## v1.92.53

* Added customizable Team Assessment questions so teams can tailor the assessment prompts used on retrospective boards. From [GitHub PR #1646](https://github.com/microsoft/vsts-extension-retrospectives/pull/1646)
* Added localization support, including Spanish, German, and French translations, plus localized date and number formatting. From [GitHub PR #1657](https://github.com/microsoft/vsts-extension-retrospectives/pull/1657) and [GitHub PR #1658](https://github.com/microsoft/vsts-extension-retrospectives/pull/1658)
* Added option to define retrospective board using current sprint iteration. From [GitHub PR #1659](https://github.com/microsoft/vsts-extension-retrospectives/pull/1659)
* Improved retrospective board responsiveness and feedback-item rendering performance to reduce hangs during heavy board activity. From [GitHub PR #1622](https://github.com/microsoft/vsts-extension-retrospectives/pull/1622) and [GitHub PR #1624](https://github.com/microsoft/vsts-extension-retrospectives/pull/1624)

## v1.92.52

* Improved archived board delete messaging in History and hardened loading-state recovery to avoid indefinite spinner states after data-load failures. From [GitHub PR #1578](https://github.com/microsoft/vsts-extension-retrospectives/pull/1578)
* Improved live-sync reliability with automatic reconnect, manual retry, and connection telemetry for better diagnostics. From [GitHub PR #1580](https://github.com/microsoft/vsts-extension-retrospectives/pull/1580)
* Improved feedback-item ordering by votes in retrospective email summary and CSV export, with newest-first tie-breaking for consistent results. From [GitHub PR #1581](https://github.com/microsoft/vsts-extension-retrospectives/pull/1581)
* Refactored favorability-band helper logic in team assessment score aria-label generation. From [GitHub PR #1582](https://github.com/microsoft/vsts-extension-retrospectives/pull/1582)
* Refactored remaining Fluent UI dependencies by replacing selector-combo, dialogs, buttons, editable inputs, and board summary list/table implementations with native HTML elements, with associated style and test updates. From [GitHub PR #1583](https://github.com/microsoft/vsts-extension-retrospectives/pull/1583)
* Improved Team Assessment info button accessibility by providing explicit accessible names and descriptions for screen readers. From [GitHub PR #1584](https://github.com/microsoft/vsts-extension-retrospectives/pull/1584)
* Improved runtime performance by memoizing heavy frontend computations, optimizing team assessment history chart rendering, and updating TypeScript target settings. From [GitHub PR #1585](https://github.com/microsoft/vsts-extension-retrospectives/pull/1585)
* Tuned SignalR keep-alive configuration to improve websocket connection stability and reduce noisy keep-alive traffic. From [GitHub PR #1586](https://github.com/microsoft/vsts-extension-retrospectives/pull/1586)
* Improved feedback-item accessibility with list semantics, clearer selection and favorability labels, and quieter screen-reader behavior while typing. From [GitHub PR #1589](https://github.com/microsoft/vsts-extension-retrospectives/pull/1589)

## v1.92.51

* Fixed readability of retrospective summary percentages by adjusting background styling. From [GitHub PR #1552](https://github.com/microsoft/vsts-extension-retrospectives/pull/1552)
* Updated AdjustIcon SVG for improved design and functionality. From [GitHub PR #1554](https://github.com/microsoft/vsts-extension-retrospectives/pull/1554)
* Updated the Retrospective Wiki URL to the correct domain. From [GitHub PR #1556](https://github.com/microsoft/vsts-extension-retrospectives/pull/1556)

## v1.92.50

* Refined the board layout to display multiple cards per column responsively. From [GitHub PR #1548](https://github.com/microsoft/vsts-extension-retrospectives/pull/1548)
* Fixed team dropdown visibility so boards did not display it when the default team in the list never had a retrospective. From [GitHub PR #1550](https://github.com/microsoft/vsts-extension-retrospectives/pull/1550)

## v1.92.49

* Fixed regression issues. From [GitHub PR #1545](https://github.com/microsoft/vsts-extension-retrospectives/pull/1545)

## v1.92.48

* Added Team Assessment History dialog with trend charts to review past assessment results. From [GitHub PR #1392](https://github.com/microsoft/vsts-extension-retrospectives/pull/1392)
* Enhanced timer with a configurable countdown, duration picker, start/stop chimes, and visibility that adapts by board phase. From [GitHub PR #1392](https://github.com/microsoft/vsts-extension-retrospectives/pull/1392) and [GitHub PR #1405](https://github.com/microsoft/vsts-extension-retrospectives/pull/1405)
* Refactored User Votes as My Votes and added total votes as Team Votes. From [GitHub PR #1405](https://github.com/microsoft/vsts-extension-retrospectives/pull/1405)
* Implemented keyboard navigation, focus handling, and a dedicated keyboard shortcuts dialog for improved accessibility. From [GitHub PR #1386](https://github.com/microsoft/vsts-extension-retrospectives/pull/1386)
* Introduced column notes to provide detailed context for each board column. From [GitHub PR #1372](https://github.com/microsoft/vsts-extension-retrospectives/pull/1372) and [GitHub PR #1392](https://github.com/microsoft/vsts-extension-retrospectives/pull/1392)
* Replaced icons sourced from Font Awesome and Fluent UI with SVG icons sourced from Material UI. From [GitHub PR #1453](https://github.com/microsoft/vsts-extension-retrospectives/pull/1453)
* Consolidated and simplified CSS styling rules; simplified styling for grouped feedback; removed mobile view styling and user setting. From [GitHub PR #1392](https://github.com/microsoft/vsts-extension-retrospectives/pull/1392)
* Restricted delete board functionality to the board owner or a team admin. From [GitHub PR #1308](https://github.com/microsoft/vsts-extension-retrospectives/pull/1308)
* Updated hyperlinks in CONTRIBUTING markdown file. From [GitHub PR #1305](https://github.com/microsoft/vsts-extension-retrospectives/pull/1305)
* Added "Ways to Contribute" to the CONTRIBUTING markdown file. From [GitHub PR #1304](https://github.com/microsoft/vsts-extension-retrospectives/pull/1304)
* Removed groups from Permission table, since setting permission by groups not supported. From [GitHub PR #1294](https://github.com/microsoft/vsts-extension-retrospectives/pull/1294)
* Improved test code coverage. From [GitHub PR #1289](https://github.com/microsoft/vsts-extension-retrospectives/pull/1289)

## v1.92.46

* Corrected defect preventing user from saving after marking column for deletion. From [GitHub PR #1284](https://github.com/microsoft/vsts-extension-retrospectives/pull/1284)

## v1.92.45

* Reverted Azure DevOps extension API to prior version to be compatible with older on-premise version. From [GitHub PR #1282](https://github.com/microsoft/vsts-extension-retrospectives/pull/1282)

## v1.92.43

* Refactored the Retrospective Extension settings menu to more closely mirror the ADO menus format.
* Moved the Prime Directive option from the Retrospective Board to the Retrospective menu options.
* Updated dialog text for Prime Directive and User Guide (renamed from Get Help).
* Added Volunteer menu option which displays the CONTRIBUTING markdown file.
* Moved volunteering information from the README markdown file to the CONTRIBUTING markdown file.
* Dropped option to clear visit history which resulted in defaulting user to last board created instead of last board visited on the next visit (often the same board).
* Updated keywords and icons for menu options, and modified menu options to follow consistent capitalization.
* Added dynamic toggling between icon with text and just icon depending on screen size and orientation.
* Enabled the switch to mobile view and switch to desktop view options which were not functional.
* Addressed numerous issues with the mobile view, including limiting mobile to core functionality and improving the layout for easier viewing.
* Removed redundant automated tests for extension menu settings while maintaining same test code coverage.

From [GitHub PR #1234](https://github.com/microsoft/vsts-extension-retrospectives/pull/1234)

* Added Team Admin, in addition to Board Owner, identification in Permission table.
* Restricted edit permissions functionality to the Board Owner or a Team Admin.

From [GitHub PR #1206](https://github.com/microsoft/vsts-extension-retrospectives/pull/1206)

* Moved functionality to delete Retrospectives boards from the Board menu to the History table.
* Enabled delete functionality only for archived boards.
* Clarified warning that deleting a board was permanent and cannot be undone.

From [GitHub PR #1193](https://github.com/microsoft/vsts-extension-retrospectives/pull/1193)

* Implemented _sticky_ default settings for maximum votes, Team Assessment, Prime Directive, obscure feedback, and anonymous feedback.
* Set first-time board creator defaults set to 5 for maximum votes, checked for Team Assessment and Prime Directive, and unchecked for obscure feedback and anonymous feedback.
* Allowed a minimum value of 1 for maximum votes per user.

From [GitHub PR #1184](https://github.com/microsoft/vsts-extension-retrospectives/pull/1184)

* Improved test code coverage by more than 15% as part of above pull requests, plus the following pull requests:

From [GitHub PR #1212](https://github.com/microsoft/vsts-extension-retrospectives/pull/1212)
From [GitHub PR #1213](https://github.com/microsoft/vsts-extension-retrospectives/pull/1213)
From [GitHub PR #1214](https://github.com/microsoft/vsts-extension-retrospectives/pull/1214)
From [GitHub PR #1222](https://github.com/microsoft/vsts-extension-retrospectives/pull/1222)
From [GitHub PR #1227](https://github.com/microsoft/vsts-extension-retrospectives/pull/1227)
From [GitHub PR #1231](https://github.com/microsoft/vsts-extension-retrospectives/pull/1231)
From [GitHub PR #1237](https://github.com/microsoft/vsts-extension-retrospectives/pull/1237)
From [GitHub PR #1238](https://github.com/microsoft/vsts-extension-retrospectives/pull/1238)
From [GitHub PR #1241](https://github.com/microsoft/vsts-extension-retrospectives/pull/1241)
From [GitHub PR #1242](https://github.com/microsoft/vsts-extension-retrospectives/pull/1242)
From [GitHub PR #1243](https://github.com/microsoft/vsts-extension-retrospectives/pull/1243)
From [GitHub PR #1255](https://github.com/microsoft/vsts-extension-retrospectives/pull/1255)

* Additional 12 pull requests covering pipelines, performance, formatting, accessibility, and other maintenance.

## v1.92.38

This release included functionality to aggregate votes when grouping items with votes, an update of the archive functionality to include _restoring_ archived retrospectives, and a _refresh_ of the existing retrospective templates.

Changes related to the aggregated votes on grouped items include:

* Displays aggregated total votes for grouped items when the parent item is collapsed.
* Displays unaggregated total votes for individual items when parent item is expanded.
* Displays aggregated Your Votes for grouped items when the parent item is collapsed.
* Displays unaggregated Your Votes for individual items when the parent item is expanded.
* In Focus Mode, displays aggregated total votes for grouped items when parent item is collapsed or expanded.
* In Act phase and Focus Mode, orders cards by aggregated total votes then by created date.
* Displays aggregated votes in light bold and unaggregated votes in normal font; reduced font size on Your Votes.
* Adjusted font size and line spacing for list of added work items; corrected styling rule typo.
* Forces refresh of Votes Used when changing boards.
* Refactored vote calculations and added automated tests for vote methods.
* Refactored sorting by total votes and created date as reusable method.
* Refactored flags used for displaying votes on cards when in Act mode or Focus mode.
* Corrected defect when rendering one grouped item in Focus mode without slider.

From [GitHub PR #1171](https://github.com/microsoft/vsts-extension-retrospectives/pull/1171)

Changes related to the archive functionality include:

* Archived status and date were added to the History tab.
* Archive functionality can be toggled on and off from the History tab.
* Archive messaging from the Boards menu was updated to reference the ability to restore the archived board from the History tab.
* Count of feedback items replaced count of pending work items.
* Significantly reduced loading time for History tab.

From [GitHub PR #1162](https://github.com/microsoft/vsts-extension-retrospectives/pull/1162)

Changes related to the templates include:

* Moved the standard retrospective templates before those designed to support the team assessment.
* Reordered retrospective templates with more common templates before less common templates.
* Reordered team assessment templates to follow same order as team assessment survey.
* Added the missing Efficiency template to support the team assessments.
* Included simple context dividers between the types of templates in the dropdown.
* Renamed 1-to-1 template as Good-to-Done template.
* Revised Good-Bad-Ideas to Good-Improve-Ideas, since Improve has a better connotation than Bad.
* Added Thanks to Good-Improve-Ideas to demonstrate incorporating a column for appreciation.
* Tweaked prompts on Speedboat and Good-to-Done templates.
* Revised name of Confidence and Efficiency templates to follow consistent pattern with other team assessment templates.
* Updated team assessment retrospective prompts to follow consistent pattern but with variety.
* Revised team assessment retrospective prompt on "One action" column to support teams not sprinting.
* Updated icons used in templates to better align with the varied template column prompts.
* Updated associated color palate to follow a green, yellow, red pattern for positive, neutral, negative feedback.
* Reorganized icon selection pane to align similarly themed icons on the same row.

From [GitHub PR #1121](https://github.com/microsoft/vsts-extension-retrospectives/pull/1121)

## v1.92.35

* Removes duplicates from Permissions and sorts by owner, permission, teams and members. From [GitHub PR #1120](https://github.com/microsoft/vsts-extension-retrospectives/pull/1120)
* Defaults Prime Directive and Anonymous to false and updates settings order. From [GitHub PR #1115](https://github.com/microsoft/vsts-extension-retrospectives/pull/1115)
* Removes All Teams from team dropdown which was not supported since retrospectives should be safe space for teams to share feedback without concern that members not on team have access to their retrospective board. From [GitHub PR #1112](https://github.com/microsoft/vsts-extension-retrospectives/pull/1112)
* Removed redundant "reflect-hub" tag when adding work item using Act tab. From [GitHub PR #1107](https://github.com/microsoft/vsts-extension-retrospectives/pull/1107)
* Updated Marcus Buckingham hyperlinks in the Energy team assessment tooltip. From [GitHub PR #1106](https://github.com/microsoft/vsts-extension-retrospectives/pull/1106)
* Replaces references to "backlog grooming" with "backlog refinement" in README file. From [GitHub PR #1101](https://github.com/microsoft/vsts-extension-retrospectives/pull/1101)
* Eliminated single word line wraps in Team Assessment for more compact views. From [GitHub PR #1100](https://github.com/microsoft/vsts-extension-retrospectives/pull/1100)
* Corrects modified date typo in code. From [GitHub PR #1097](https://github.com/microsoft/vsts-extension-retrospectives/pull/1097)
* Replaces undefined Session Date with Created Date in Retrospective Summary. From [GitHub PR #1096](https://github.com/microsoft/vsts-extension-retrospectives/pull/1096)
* Orders cards by Created Date, unless Act column, which orders cards by Votes, then Created Date. From [GitHub PR #1095](https://github.com/microsoft/vsts-extension-retrospectives/pull/1095)
* Adds dividers to feedback board context menu for better organization. From [GitHub PR #1087](https://github.com/microsoft/vsts-extension-retrospectives/pull/1087)
* Fixes inconsistent capitalization in feedback board menu. From [GitHub PR #1080](https://github.com/microsoft/vsts-extension-retrospectives/pull/1080)
* Updated Efficiency team assessment tooltip to reference current research. From [GitHub PR #1068](https://github.com/microsoft/vsts-extension-retrospectives/pull/1068)
* Fixed images in Marketplace extension. From [GitHub PR #1033](https://github.com/microsoft/vsts-extension-retrospectives/pull/1033)

## v1.92.34

* Corrected User Votes on Vote tab header and Your Votes on individual cards. From [GitHub PR #1023](https://github.com/microsoft/vsts-extension-retrospectives/pull/1023)
* Changed icon used for Efficiency to be distinct from Energy for Team Assessment. From [GitHub PR #1022](https://github.com/microsoft/vsts-extension-retrospectives/pull/1022)

## v1.92.X

* Boards can now restrict access down to specific teams or individuals. From [GitHub PR #650](https://github.com/microsoft/vsts-extension-retrospectives/pull/650)

* Feedback items are numbered from 1, not 0. From [GitHub PR #663](https://github.com/microsoft/vsts-extension-retrospectives/pull/663)

## v1.92.1

* Team Assessment form: Background colors for each number on the spectrum now more closely resemble the Retrospective summary's color separation for the three categories: Reds and Oranges for Unfavorable (1-6), Yellows for Neutral (7-8), Greens for Favorable (9-10). From [GitHub PR #531](https://github.com/microsoft/vsts-extension-retrospectives/pull/531).

* Related feedback items, in "Focus Mode", now show the original column textual as well as visually. From [GitHub PR #544](https://github.com/microsoft/vsts-extension-retrospectives/pull/544)

* New tab in "Focus Mode", called "All", which contains every card on the current retrospective board so that your team can prioritize the highest voted cards first. From [GitHub PR #531](https://github.com/microsoft/vsts-extension-retrospectives/pull/543).

* Duplicate an existing board with the new menu option "Create a copy of retrospective". [GitHub PR #561](https://github.com/microsoft/vsts-extension-retrospectives/pull/561)

* Package updates for SASS and ReactTable that enhances the developer experience to run `npm i` without the need of `--force` or `--legacy-peer-deps`. From [GitHub PR #553](https://github.com/microsoft/vsts-extension-retrospectives/pull/553)

## v1.91.1

* Adding `import data` and `export data` functions

## v1.90.3

* GitHub Experience: Updating README to include the code coverage and status badges. GitHub PRs now get code coverage comments from CodeCov. From [GitHub PR #461](https://github.com/microsoft/vsts-extension-retrospectives/pull/461).

* Adding a new board template to Efficiency

## v1.90.2 ([GitHub PR #463](https://github.com/microsoft/vsts-extension-retrospectives/pull/463))

* Unifying board template column helper structures.

## v1.90.1 ([GitHub PR #462](https://github.com/microsoft/vsts-extension-retrospectives/pull/462))

* Modified default to Include team assessment, display 'Retrospective Prime Directive', do not display names in feedback.

* Added "Discuss and Act" button to the Team Assessment allowing teams to discuss and take action on specific areas in the Team Assessment

* Sorted Team Assessment results in order of opportunity

## v1.80.1

* Board Templates made available to all structures, so, they'll be available globally

## v1.70.1

* Team Assessment Chart added to Retrospective Summary Dialog

## v1.60.*

* Fixing stuck in the loading state

## v1.60.0

* Lots of fixes to styling of elements, they're more responsive to the selected theme of the _Azure DevOps_
* New templates added to _Create Retrospective Board_ dialog
* _Retrospective Board Summary_ dialog added

## v1.0.56

* Timer option added to _Act_ phase

## v1.0.55

* Introduced visual Ids to _Feedback Items_

## v1.0.54

* New templates added to _Create Retrospective Board_ dialog

## v1.0.53

* DOM elements reduced to make the page render quickly
* Exporting the Retrospective Board content as a CSV file

## v1.0.52

* More performance tweaks
* Finally, participants have max vote limit
* Prime Directive added to options when creating a new Retrospective Board

## v1.0.51

* Lots of performance tweaks

## v1.0.50

* _Copy Retrospective Link_ button generates correct url in some edge cases
* _What's New_ button added to the UI
* Button added to _What's New_ dialog to launch this page in a new tab
* Participants may uncast votes on feedback items

## v1.0.49

* _Copy Retrospective Link_ button generates correct url
* _Export CSV Content_ button generates and downloads current Retrospective board content in CSV format

## v1.0.48

* Templates added to _Create new retrospective_ dialog, so it's now possible to create a board from
one of those templates, such as, _Mad-Sad-Glad_, _Start-Stop-Continue_, etc.
* New icon and color options added for columns

## v1.0.47

* Maximum number of columns per Retrospective Board increased to 5 from 4
* Support for collecting feedback items _blurred_ in Collect phase

## v1.0.46

* Bazillion tiny fixes, here and there
* Support for Light, Dark and Custom themes of Azure DevOps

_PS: Changelog before v1.0.46 is not available_ 🤦‍♂️
