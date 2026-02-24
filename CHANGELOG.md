# Changelog

You can find the changelog of the Retrospective Extension below.

## v1.92.52

* Fix: improve archived board delete messaging in History and harden loading-state recovery to avoid indefinite spinner states after data-load failures. From [GitHub PR #1578](https://github.com/microsoft/vsts-extension-retrospectives/pull/1578)
* Fix: improve live-sync reliability with automatic reconnect, manual retry, and connection telemetry for better diagnostics. From [GitHub PR #1580](https://github.com/microsoft/vsts-extension-retrospectives/pull/1580)
* Fix: order feedback items by votes in retrospective email summary and CSV export, with newest-first tie-breaking for consistent results. From [GitHub PR #1581](https://github.com/microsoft/vsts-extension-retrospectives/pull/1581)
* Refactor: inline favorability-band helper logic in team assessment score aria-label generation. From [GitHub PR #1582](https://github.com/microsoft/vsts-extension-retrospectives/pull/1582)
* Refactor: remove remaining Fluent UI dependencies by replacing selector-combo, dialogs, buttons, editable inputs, and board summary list/table implementations with native HTML elements, with associated style and test updates. From [GitHub PR #1583](https://github.com/microsoft/vsts-extension-retrospectives/pull/1583)
* Fix: improve Team Assessment info button accessibility by providing explicit accessible names and descriptions for screen readers. From [GitHub PR #1584](https://github.com/microsoft/vsts-extension-retrospectives/pull/1584)

## v1.92.51

* Fix: improve readability of retrospective summary percentages by adjusting background styling. From [GitHub PR #1552](https://github.com/microsoft/vsts-extension-retrospectives/pull/1552)
* Feat: update AdjustIcon SVG for improved design and functionality. From [GitHub PR #1554](https://github.com/microsoft/vsts-extension-retrospectives/pull/1554)
* Fix: update Retrospective Wiki URL to the correct domain. From [GitHub PR #1556](https://github.com/microsoft/vsts-extension-retrospectives/pull/1556)

## v1.92.50

* Responsive board layout to view multiple cards per column. From [GitHub PR #1548](https://github.com/microsoft/vsts-extension-retrospectives/pull/1548)
* Boards do not display team dropdown when default team in list never had retrospective. From [GitHub PR #1550](https://github.com/microsoft/vsts-extension-retrospectives/pull/1550)

## v1.92.49

* Fixing regression issues. From [GitHub PR #1545](https://github.com/microsoft/vsts-extension-retrospectives/pull/1545)

## v1.92.48

* Added Team Assessment History dialog with trend charts to review past assessment results. From [GitHub PR #1392](https://github.com/microsoft/vsts-extension-retrospectives/pull/1392)
* Enhanced timer with a configurable countdown, duration picker, start/stop chimes, and visibility that adapts by board phase. From [GitHub PR #1392](https://github.com/microsoft/vsts-extension-retrospectives/pull/1392) and [GitHub PR #1405](https://github.com/microsoft/vsts-extension-retrospectives/pull/1405)
* Implemented keyboard navigation, focus handling, and a dedicated keyboard shortcuts dialog for improved accessibility. From [GitHub PR #1386](https://github.com/microsoft/vsts-extension-retrospectives/pull/1386)
* Restricts delete board functionality to the board owner or a team admin. From [GitHub PR #1308](https://github.com/microsoft/vsts-extension-retrospectives/pull/1308)
* Updated hyperlinks in CONTRIBUTING markdown file. From [GitHub PR #1305](https://github.com/microsoft/vsts-extension-retrospectives/pull/1305)
* Added "Ways to Contribute" to the CONTRIBUTING markdown file. From [GitHub PR #1304](https://github.com/microsoft/vsts-extension-retrospectives/pull/1304)
* Removes groups from Permission table, since setting permission by groups not supported. From [GitHub PR #1294](https://github.com/microsoft/vsts-extension-retrospectives/pull/1294)
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

* Identifies Team Admin, in addition to Board Owner, in Permission table.
* Only the Board Owner or a Team Admin can edit permissions to access the retrospective board.

From [GitHub PR #1206](https://github.com/microsoft/vsts-extension-retrospectives/pull/1206)

* Moves functionality to delete Retrospectives boards from the Board menu to the History table.
* Only enables delete functionality for archived boards.
* More clearly warns that deleting a board is permanent and cannot be undone.

From [GitHub PR #1193](https://github.com/microsoft/vsts-extension-retrospectives/pull/1193)

* Implements _sticky_ default settings for maximum votes, Team Assessment, Prime Directive, obscure feedback, and anonymous feedback.
* First time board creators will have defaults set to 5 for maximum votes, checked for Team Assessment and Prime Directive, and unchecked for obscure feedback and anonymous feedback.
* Allows a minimum value of 1 for maximum votes per user.

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
