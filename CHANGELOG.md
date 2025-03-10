# Changelog

You can find the changelog of the Retrospective Extension below.

_PS: Unfortunately, changelog before v1.0.46 is not available_ 🤦‍♂️

## v1.92.34

* Corrected User Votes on Vote tab header and Your Votes on individual cards
* Changed icon used for Efficiency to be distinct from Energy for Team Assessment

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
