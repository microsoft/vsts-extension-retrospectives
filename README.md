# Retrospective Extension for Azure DevOps

[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/microsoft/vsts-extension-retrospectives/badge)](https://scorecard.dev/viewer/?uri=github.com/microsoft/vsts-extension-retrospectives)
[![OpenSSF Best Practices](https://www.bestpractices.dev/projects/9514/badge)](https://www.bestpractices.dev/projects/9514)
[![CodeCov](https://codecov.io/gh/microsoft/vsts-extension-retrospectives/branch/main/graph/badge.svg?token=XU0895TPB4)](https://codecov.io/gh/microsoft/vsts-extension-retrospectives)
[![CI and CD for Frontend](https://github.com/microsoft/vsts-extension-retrospectives/actions/workflows/ci_cd_frontend.yml/badge.svg)](https://github.com/microsoft/vsts-extension-retrospectives/actions/workflows/ci_cd_frontend.yml)
[![CI_Backend](https://github.com/microsoft/vsts-extension-retrospectives/actions/workflows/ci_backend.yml/badge.svg)](https://github.com/microsoft/vsts-extension-retrospectives/actions/workflows/ci_backend.yml)

Retrospectives is an [Azure DevOps](https://dev.azure.com) extension to perform _smart and efficient retrospectives from within the Azure DevOps._

Retrospectives are an important practice in becoming an effective team, allowing the team to gather feedback and continuously improve based on the feedback.

Research from the [2018 State of DevOps report](https://services.google.com/fh/files/misc/state-of-devops-2018.pdf) indicates that elite teams are 1.5 times more likely to consistently hold retrospectives and use them to improve their work. Furthermore, a [2013 meta-analysis on teams](https://journals.sagepub.com/doi/full/10.1177/0018720812448394) indicates that teams that effectively debrief/conduct retrospectives are 20-25% more effective.

Teams often use external retrospective tools, white boards with Post-its, OneNote, etc. to conduct retrospectives. The data then needs to be collated, and any actionable items need to be created in your Azure DevOps pipeline.

The [Retrospectives extension](https://marketplace.visualstudio.com/items?itemName=ms-devlabs.team-retrospectives) allows you to do all this and more from within Azure DevOps.

## Table of Contents

- [Retrospectives](#retrospective-extension-for-azure-devops)
  - [Retrospective Features](#retrospective-features)
  - [Install](#install)
  - [Use](#use)
  - [Live Sync Troubleshooting](#live-sync-troubleshooting)
  - [Best Practices](#best-practices)
  - [Contribute](#contribute)
  - [License](#license)

## Retrospective Features

- Retrospectives in Azure DevOps
- Real time support for distributed retrospectives
- Ability to create Azure DevOps work items associated to feedback
- Create an emailable summary of a retrospective

## Install

The extension can be installed from [Azure DevOps Marketplace](https://marketplace.visualstudio.com/items?itemName=ms-devlabs.team-retrospectives).

## Use

Please note: the screenshot examples use light mode and dark mode interchangeably because both are supported!

### 1. Open Retrospectives Extension

Navigate to the Azure 'Boards' tab in your account on the left hand navigation. Select the 'Retrospectives' tab under 'Boards'.

![A screenshot of the Azure DevOps left-hand navigation. Under the Boards heading, the extension for the retrospective is darkened as though hovered by a mouse.](https://github.com/microsoft/vsts-extension-retrospectives/raw/main/documentation/images/desktop/azdo-side-bar.png)

### 2. Pick the Team

You are now on the Retrospectives page. Select your Azure DevOps team from the dropdown in the header. You will only be able to select from My Teams.

Retrospectives should be a safe space for team members to share feedback. Therefore, you should not have access to other teams' retrospective boards. All Teams would provide access to see feedback from any team in the project.

If you need to access another team's retrospective board in the project, you will need to be added as a member of that team.

![Screenshot of the Retrospective tool's Team dropdown. In the example the user belongs to only one team, the "Backend Team". The selected team is darkened as though the mouse is hovering over the selection.](https://github.com/microsoft/vsts-extension-retrospectives/raw/main/documentation/images/desktop/team-dropdown-My-Teams.png)

### 3. Create New Retrospective

Create a new retrospective using the 'Create Board' button. If this is your first retrospective for your selected team, then press the "Create Board" button in the center of the screen.

[▶ Watch video](https://user-images.githubusercontent.com/118744/208821363-cde5b0e1-e747-4158-8d8b-99017b4c3cc4.mp4)

![A screenshot of the Retrospective main page. The screen is mostly empty except for the top navigation of the tool. In the center there is a blue button to 'Create Board.'](https://github.com/microsoft/vsts-extension-retrospectives/raw/main/documentation/images/desktop/create-first-retrospective.png)

If you have created a retrospective before for your selected team, then you can select "Create a new retrospective" from the navigation drop down.

![A screenshot of the top navigation in the Retrospective tool, where the 'Board Actions' menu has been opened. The first option in the dropdown is the 'Create new retrospective.'](https://github.com/microsoft/vsts-extension-retrospectives/raw/main/documentation/images/desktop/menu-dropdown-create-new-retrospective.png)

### 4. Choose Your Retrospective Settings

When you select **Create Board** or **Create new retrospective** as above, you will see the following dialog:

![A screenshot showing the modal box that controls the initial settings for creating a retrospective board. The settings include: a text field for title of the retrospective; a number input box for maximum votes per person; a checkbox to include a Team Assessment; a checkbox to obscure the feedback of others during the Collect Phase; a checkbox to include Retrospective Prime Directive; and a section to pick the different columns to include in the retrospective, either customized or loaded from predefined templates.](https://github.com/microsoft/vsts-extension-retrospectives/raw/main/documentation/images/desktop/create-new-retrospective.png)

Please enter the appropriate information:

- **Retrospective Title**: Title for the Retrospective.
- **Max Votes per User**: The maximum number of votes a participant has to use in the "Vote" phase.
- **Include Team Assessment**: Include a Team Assessment link at the top of the board.
- **Obscure the feedback of others until after Collect phase**: When selected, users cannot see other users input until they have moved to another phase. Other users' feedback will be blurred.
- **Do not display names in feedback**: When checked, anonymize who creates individual feedback items.
- **Columns Settings**: You can either apply from a pre-populated template or individually select and configure columns yourself.

![A screenshot showing the dropdown of available templates for the retrospective board. They represent the different columns that can be included.](https://github.com/microsoft/vsts-extension-retrospectives/raw/main/documentation/images/desktop/select-a-template.png)

**Notes:**

- Retrospective Title is the minimum 'required' information (other fields can stay at default as needed). Once the title is provided, the `Save` button is enabled. Save the retrospective using the `Save` button.
- The system will remember your selection for maximum votes, team assessment, obscure feedback, and do not display names when saving and use those setting as your defaults for the next a board you create.
- The **Permission** tab allows the board owner or team admin to restrict access to the retrospective board by team or by individual. By default the retrospective board is accessible to everyone in the project.

### 5. Select An Existing Retrospective Board

Once you have created the retrospective board and you want to select a retrospective board different from the currently displayed board, click on the retrospective board name and select the desired one. You can use the search box to find the appropriate retrospective boards if you have a large number of boards.

![A screenshot showing the dropdown for searching available retrospective boards after they've been created. The current Retrospective Board is "Retrospective for Sprint 8" and the selection for "Retrospective for Sprint 7" is darkened as though hovered.](https://github.com/microsoft/vsts-extension-retrospectives/raw/main/documentation/images/desktop/retro-board-dropdown.png)

### 6. Share the Link to the Retrospective

Once you create a new retrospective, you can share a link to it to all participants. Users can then access that link even from their mobile browsers to participate in the retrospective. The extension offers real time synchronization, so all users will see the most up-to-date information without having to refresh the page.

![A screenshot of the dropdown from the Board Actions Menu. The option for 'Copy retrospective link' is highlighted as the fourth menu option.](https://github.com/microsoft/vsts-extension-retrospectives/raw/main/documentation/images/desktop/menu-dropdown-copy-retrospective-link.png)

### 7. Phases of the Standard Retrospective

The number of columns in each retrospective is determined by the selection made when making the new board. Regardless of the template, they still follow the same sequence of phases.

#### The Prime Directive

Begin by reminding participants that the retrospective is a safe space and that the issues raised are meant to address process problems, not people problems. Optionally, display the 'Retrospective Prime Directive' by clicking the Directive icon in the upper-right Retrospectives Extension menu. Read the Prime Directive aloud for everyone to hear, and allow space for participants to voice any concerns.

![A screenshot of the prime directive](https://github.com/microsoft/vsts-extension-retrospectives/raw/main/documentation/images/desktop/the-prime-directive.png)

#### Collect

In this phase feedback is collected from all participants. Users can add feedback under any of the columns using the 'Add new card' button or by double clicking the empty space of the column's background.

![A screenshot of an example retrospective board column, showing the example user Avery Axolotl writing in a feedback item that says 'Accidentally deleted my branch on remote. Dang!'](https://github.com/microsoft/vsts-extension-retrospectives/raw/main/documentation/images/desktop/write-new-feedback-item.png)

If when creating a retrospective, the checkbox for "Do not display names on feedback" is checked, then the cards will show no names, appearing anonymous.

If when creating a retrospective, the checkbox for 'Obscure the feedback of others during the Collect Phase' was checked, then while typing, the feedback of others will not be shown, even if anonymous. You can only edit items that you have created in this mode.

![A screenshot of a board that shows two columns for "Mad" and "Sad." The each column has two feedback items: one which has text visible and another where there is a blur that obscures the text from another user](https://github.com/microsoft/vsts-extension-retrospectives/raw/main/documentation/images/desktop/obscured-anonymous-feedback.png)

Once feedback from all users is collected, move on to the next phase of **Group**.

#### Group

In this phase, any similar feedback can be grouped together beneath a "header" or champion item. If you feel two feedback items are similar, drag one onto another to group them together. Dragging any item onto a group, will add items to that group.

![A screenshot that shows a piece of feedback being dragged on top of another due to their similarity. The item being dragged is semi-transparent.](https://github.com/microsoft/vsts-extension-retrospectives/raw/main/documentation/images/desktop/group-feedback-by-dragging.png)

If you would rather not drag you can use the feedback item's action menu (the ellipsis '...') to "Group Feedback". This will bring up a search box and you can type in the feedback item you would like to group your selected item under.

![A screenshot that shows the selected feedback item's action menu. The "Group Feedback" is made darker as though a mouse is hovering.](https://github.com/microsoft/vsts-extension-retrospectives/raw/main/documentation/images/desktop/group-feedback-by-feedback-menu.png)

![A screenshot that shows a search bar. The word "team" has been typed in and shows a feedback item has been found with that word.](https://github.com/microsoft/vsts-extension-retrospectives/raw/main/documentation/images/desktop/group-feedback-search-dialog.png)

Both methods of grouping will result in the item being grouped beneath the other.

![A screenshot that shows that one feedback from Fernando Flamingo is grouped beneath Avery Axolotl's feedback because both discussed team bonding.](https://github.com/microsoft/vsts-extension-retrospectives/raw/main/documentation/images/desktop/grouped-feedback-expanded.png)

Once all similar items are grouped together, move on to the next phase of **Vote**.

#### Vote

In this phase, participants will individually go through all the feedback items and vote on the ones they feel are important, by clicking on the 'Upvote' icon. Users can reduce their number of votes on a specific item by clicking on the 'Downvote' icon.

Note the _Max Votes per User_ set by the board creator are displayed as the denominator in a ratio of "Votes Used". Votes used by the user are updated in real time as the user clicks on 'Upvote' and 'Downvote' icons.

![A screenshot that shows a user has used two votes out of five, which is indicated next to "Votes Used." The two items that have been voted on by the user show a "Your Votes: 1" in the feedback card.](https://github.com/microsoft/vsts-extension-retrospectives/raw/main/documentation/images/desktop/vote-feedback-in-progress.png)

Once everyone is done voting, move on to the next phase of **Act**.

#### Act

In this phase, the team will go through each feedback item.  You will notice that the items with the most votes will appear at the top of the column. It is recommended that each time you do this exercise, you only select one or two of the feedback items to take action against. Click on the 'Add action item' button on a feedback card, and select the type of work item that needs to be created in Azure DevOps.

This will open up the standard Azure DevOps work item creation form. Enter the work item details and save. This will create the work item in your Azure DevOps account and also associate it to the feedback item.

![A screenshot that shows a feedback item in the 'Act Phase'. On the example feedback items, the button for 'Add Action Item,' an ellipsis, has been pressed to reveal a selection of options. The user has the option to create a number of different Azure Dev Ops items, like adding a bug, a user story, and others. In this case, the item that is darkened as though hovered by a mouse is the 'User Story' option.](https://github.com/microsoft/vsts-extension-retrospectives/raw/main/documentation/images/desktop/add-action-item-dropdown.png)

### 8. Optional: The Team Assessment

You can optionally include a "Team Assessment" that anonymously collects feedback from participants.
To get the feedback form, you can click on the "Team Assessment" link at the top of the board.

![A screenshot of where you see the link to "Team Assessment"](https://github.com/microsoft/vsts-extension-retrospectives/raw/main/documentation/images/desktop/team-assessment.png)

The assessment tracks 6 categories:

- Clarity
- Energy
- Psychological Safety
- Work-life Balance
- Confidence
- Efficiency

The users will rank on a scale of 1 to 10; scores of 1-6 are categorized as "Unfavorable", 7 and 8
are "Neutral," and 9 and 10 are "Favorable."

![A screenshot of an example user filling out the team assessment. Each question has alternating background for visual distinction. Each question/category has a short description and a tooltip icon that provides more context.](https://user-images.githubusercontent.com/114175122/203422503-e87ea9ba-9fac-4e5d-a938-dc5b07768f9c.png)

Once the team assessment has been completed, the summary of answers can be viewed in the Retrospective
Summary Dialog (see below).

#### Improving Based on Team Assessment Scores

Teams may choose to address the issues found in the team assessment in multiple ways:

- Through open conversations during the standard retrospective process to identify opportunities for
improvement.
  - While this approach works, it may not be effective if the team isn't psychologically safe, and our
  research indicates that only 10% of the teams that do team assessments are psychologically safe.
- Through a Team Assessment Retrospective
  - A Team Assessment Retrospective is a new approach to retrospectives allowing teams to identify
  the largest opportunities for improvement based on each team members' responses to the team assessment.

### The Six Steps to a Team Assessment Retrospective

#### Setup

Create a new retrospective using the steps above with the following exceptions:

- 'Include Team Assessment' is checked
- 'Do not display names in feedback' is checked
- Note: You do not need to select a template. The template will be modified after the assessment is complete
- Share the link to the retrospective with the team

![A screenshot of the new retrospective box](https://github.com/microsoft/vsts-extension-retrospectives/raw/main/documentation/images/desktop/create-new-retro-with-team-assessment-and-anonymous.png)

#### Safe Space

In this phase, the facilitator sets the stage for the retrospective. Remind everyone that any issues raised will be viewed as process problems, not people problems. Optionally, click the Directive icon and read the Prime Directive aloud to reinforce that the retrospective is a safe space for the team to improve together.

![A screenshot of the prime directive](https://github.com/microsoft/vsts-extension-retrospectives/raw/main/documentation/images/desktop/prime-directive-zoom.png)

#### Team Assessment

In this phase each team member clicks on the Team Assessment and anonymously answers all questions
and hits "submit". It is critical that you remind everyone that all feedback is anonymous and confidential.

Throughout this phase you will periodically check the retrospective summary (illustrated in then next section).

If the majority of the team hasn't responded to the assessment, close the summary dialog and encourage
everyone to participate, reminding them that if their voice isn't expressed in the assessment it can't
be acted upon.

![A screenshot of a Team Assessment](https://user-images.githubusercontent.com/114175122/203423975-b8cc6fc1-3e80-438a-87e6-db2869e8714b.png)

Re-open the retrospective summary and when the majority of the team has responded, discuss which
dimension the team would like to improve upon. Note: If more than 20% of the responses are unfavorable
for a dimension, we recommend focusing on that area first. Otherwise, it is beneficial to focus on
psychological safety first. This is because without psychological safety the more difficult conversations
that need to happen to make improvements in the other dimensions will not happen.

Once the team has decided which dimension to focus on, the facilitator will click the button "Discuss
and Act" which aligns to the dimension the team wants to focus on. This will create retrospective
with a template that aligns to the dimension.

##### Collect

In this phase team members will provide feedback to help improve the dimension they've chosen to focus
on. Ask team members to input feedback cards on the left 2 columns.

![A screenshot of the Efficiency Retrospective Board Template](https://github.com/microsoft/vsts-extension-retrospectives/raw/main/documentation/images/desktop/team-assessment-discuss-and-act-efficiency.png)

After a few moments, the facilitator reads the cards out loud. When it's apparent that no additional
feedback cards are being added, the facilitator asks the following question: "Reflecting on the
feedback we've collected, if you could take only one action in the next sprint that would yield the
biggest improvement on [dimension team is focused on improving from Team Assessment] what would it be?
Capture this in a feedback card in the third column for one action to try next sprint."

#### Group

In this phase the team will group similar items together. To expedite the process we recommend only
grouping the action items together in the last column.
After the majority of the team has added feedback cards to the third column, the facilitator switches
to the "group" tab and collectively groups like ideas together with the team (see above).

#### Vote

In this phase the facilitator asks participants to vote only on the third column and the top items
for improvement are identified.
The facilitator then waits for votes to compile and after the majority of the team has voted (the
facilitator can view the retrospective summary to quickly determine how many votes have been cast),
the facilitator clicks on the "Act" tab which automatically sorts the cards from the most to the
least voted upon.

#### Act

Follow the steps above to assign actions as work items in Azure DevOps. Note: We recommend only selecting 1-2 actions per sprint to ensure completion prior to the next sprint.

### 9. Retrospective Summary

The Retrospective Summary dialog is accessible from the "Board Actions" menu in the top navigation.

![A screenshot that shows the Board Actions menu, where the "Show retrospective summary" is highlighted as the seventh menu option.](https://github.com/microsoft/vsts-extension-retrospectives/raw/main/documentation/images/desktop/menu-dropdown-show-retrospective-summary.png)

Once there, there is a summary of the Retrospective. This includes:

- Who created the board
- Number of participants
  - If not anonymous, it will show who participated
- Number of feedback items created
- Number of votes cast
- Number of action items created

![A screenshot that shows an example retrospective summary without a team assessment.](https://github.com/microsoft/vsts-extension-retrospectives/raw/main/documentation/images/desktop/retro-summary-no-assessment-darkmode.png)

If there is a team assessment, then a charted summary will show the vote breakdown by favorability, along with an average score.

### 10. Board History

The **History** tab appears in the top-left navigation header, next to the **Board** tab. This view lists past retrospectives, showing the count of feedback items and action items, and supports archiving or restoring archived retrospectives, as well as permanently deleting archived retrospectives.

![History tab showing table with 7 columns and 5 rows. Columns include: Retrospective Name, Created Date, Archived, Archived Date, Feedback Items, Total Work Items, and Trash icon. Rows include: 4th Retrospective, 3rd Retrospective, Lean Coffee (archived with delete option active), 2nd Retrospective, and 1st Retrospective.](https://github.com/microsoft/vsts-extension-retrospectives/raw/main/documentation/images/desktop/history-view-with-archive-and-delete.png)

Selecting a retrospective expands the row to reveal more details, including a count of action items by status and a detailed list of each action item.

![Expanded retrospective view showing a summary of feedback and work item counts on the left and a work item table on the right with columns: Title, State, Type, Last Updated, Assigned To, and Priority.](https://github.com/microsoft/vsts-extension-retrospectives/raw/main/documentation/images/desktop/history-row-expanded.png)

To _archive_ a retrospective, check the box in the Archived column. The retrospective will no longer appear in the Board selection dropdown, though all data remains preserved Archiving will take effect immediately for the user performing the action, while other users will see the change only after reloading the Retrospective boards.

To _restore_ an archived retrospective, uncheck the box in the Archived column. The retrospective will reappear in the Board selection dropdown. Restoring will take effect immediately for the user performing the action, while other users will see the change only after reloading the Retrospective boards.

To _delete_ an archived retrospective, wait for two minutes after archiving, then click the trash icon to _permanently_ delete the retrospective.  The delay between archiving and deleting was added to encourage users to try the archive functionality before deleting, since the delete action cannot be undone and, in most cases, archiving will be sufficient.  Deleting will take effect immediately for all users.

## Live Sync Troubleshooting

If you see the in-app message that live syncing is unavailable, the board still works, but updates from other users may not appear until the connection is restored.

### Quick checks

- Select **Retry** in the warning banner and wait for reconnection.
- Refresh the browser tab if the warning persists.
- Verify system clock/timezone are accurate on the client machine (token validation depends on local time).

### Network / proxy checks (including enterprise ZTNA, ZScaler, etc.)

Live sync uses a SignalR connection to the backend service URL `https://app-retrospective-extension-prod.azurewebsites.net`.

- Ensure outbound HTTPS/WebSocket traffic to that hostname is allowed by your firewall/proxy.
- If your organization uses network security tooling (for example, SSL interception, private access, or zero-trust gateways), add an allow rule for the collaboration service hostname.
- Confirm that proxy policy permits long-lived connections (WebSocket or SignalR fallback transports).

### On-premise note

For Azure DevOps Server/on-prem deployments, behavior depends on your environment and backend setup. If live sync does not connect reliably, use page refresh as a fallback while validating proxy/allowlist configuration for your collaboration service endpoint.

## Best Practices

### Plan for a Team Assessment Retrospective

Planning in advance will help you make the best use of the team's time in completing a Team Assessment Retrospective.

#### In Advance of the Event

| **When** | **Action** |
| :--- | :--- |
| Week in advance (more or less depending on your team’s rhythm of business) | Create and send a calendar invite for 50 minutes for the Team Assessment.  Make sure that all team members can be present. |
| 3-5 days prior | **(1)** [Create the Retrospective in ADO](https://github.com/microsoft/vsts-extension-retrospectives/blob/main/README.md#71-the-six-steps-to-a-team-assessment-retrospective); **(2)** Create the schedule and timebox each section; **(3)** Update the meeting invite with the schedule; **(4)** Review action items from previous retro to familiarize yourself and be prepared to share |

#### At the Event

| **Activity** | **Time** | **Guidance** |
| :--- | :--- | :--- |
| Welcome & Kickoff | 10 min | **(1)** Welcome the team; **(2)** Review Agenda; **(3)** Review actions from last retro and make any updates or clarify next steps; **(4)** Kick-off with the retro |
| Conduct Team Assessment | 5 min | [Share link and give team members 2 minutes to complete team assessment](https://github.com/microsoft/vsts-extension-retrospectives/blob/main/README.md#71-the-six-steps-to-a-team-assessment-retrospective) |
| Identify area for deep dive | 10 min | [Discuss results and agree on area for deep dive](https://github.com/microsoft/vsts-extension-retrospectives/blob/main/README.md#team-assessment) |
| Conduct the deep dive retro | 15 min | [Collect, Review & Group Columns 1 & 2](https://github.com/microsoft/vsts-extension-retrospectives/blob/main/README.md#collect-1) |
| Determine action plan(s) | 10 min | [Collect, Review, Group and Vote on Column 3](https://github.com/microsoft/vsts-extension-retrospectives/blob/main/README.md#act) |
| Close the meeting | 2 min | Thank attendees for participation and summarize |

### Use Retrospectives to Give Kudos

Giving kudos, or recognizing others for their achievements, is one of the highest drivers of employee
satisfaction and retention. When people feel appreciated and supported, they will be more engaged and
motivated. Who doesn’t want that?  You have an opportunity to provide a space for kudos in every team
retrospective.  Make sure to add a column for “Kudos” in your retrospective board. It is that simple
and it just takes a moment for people to add a few pieces of feedback to acknowledge the great work
of others.  When you finish your retrospective, make sure to read through each kudos feedback item
and take a moment to celebrate!

### Use Retrospectives to Create a Team Working Agreement

Team Working Agreements are shared commitments to ways of working together. They establish team members'
work preferences. A shared agreement will balance individual and team needs, and set clear expectations
for how the team will work together.

A good team working agreement must include everyone's background, needs and voices so a retrospective
is a great way for a team to collect that information and then bring it together.  The agreement should
be relatively short, 5-7 items.

Bring your team together and create a retrospective board with 1 column:

- Good Working Preferences

Follow the phases through from Collect, Group and Vote. Make sure every team member contributes feedback
items to the Board before you Group and Vote. Read every card outloud before Grouping like items together.
After voting, you will see those working preferences that got the most votes come to the top.

Select the top 5-7 items and talk through them together as a team to ensure that they are clear and
that everyone agrees. Put those items in a document that you can keep in front of your team (at the
top of a Microsoft Team Channel, or in your Azure DevOps Dashboard). Review the Working Agreement at
the beginning of Team ceremonies or events.  Whenever there is a change in the team composition, the
Working Agreement should be reviewed again to ensure that all team members agree to each item.

### Team Assessment Best Practices

Below are a number of best practices for driving team effectiveness and using the “Team Assessment”
measurement within the Retrospective Board.

- The ‘Team Assessment’ measurement questions were selected based on significant research indicating
improvements in these areas will result in significant improvements in overall team effectiveness.
It is recommended that teams conduct a ‘Team Assessment’ measurement as a part of their standard
retrospective process once a month at a minimum.  Deep dive discussions to debrief on the area of the
biggest opportunity with actions identified should be a part of that process.

![Screenshot of the Team Assessment Questions](https://user-images.githubusercontent.com/114175122/203427827-f8e1e562-daf9-448b-9636-ec5f9beae120.png)

- Best practices for improving **clarity** include creation of and alignment to OKRs. Regular review
of OKRs with stakeholders combined with the implementation of agile development methodologies to continually
prioritize the work that will have the biggest impact on achieving the OKRs. A well maintained backlog
that is visible to the entire team and reviewed regularly will ensure clarity. The backlog should be
stack ranked in order of priority with minimum work in process will ensure team clarity on the work
that matters the most. Drive continuous improvement in clarity by using the “Clarity” Retrospective
Board template, following the standard retrospective process.
- Best practices for improving **energy** include ensuring that all team members are spending at least
20% of their time on the team doing work that they love. Each team member should embark on a journey
of self-discovery to identify what they love by keeping a record of the work that they loved doing
on a daily and weekly basis until their strengths are clearly identified. Managers should endeavor
to understand the work that their employees love by conducting a simple weekly check-in and asking 4
simple questions: "What did you do last week that energized you (you loved)?”, “What did you do last
week that drained your energy?”, "What are your priorities this week?", and "How can I (your manager)
help?". Drive continuous improvement in energy by using the “Energy” Retrospective Board template,
following the standard retrospective process.
- Best practices for improving **psychological safety** include conducting a baseline retrospective
using the "Psychological Safety" template in Azure DevOps Retrospectives (anonymously). Identify top
actions that the team will implement to improve psychological safety. Repeat the psychological safety
retrospective every 4-6 weeks until there are no scores below a 7. We've learned that every team is
different and, in most cases, simple changes can make a profound impact, but it requires asking anonymously
and taking action to improve.  Drive continuous improvement in psychological safety by using the
“Psychological Safety” Retrospective Board template, following the standard retrospective process.
- Best practices for improving **work-life balance** include the implementation of fundamental agile
practices including backlog refinement and prioritization, limiting Work In Process by establishing WIP
limits and adhering to them, and only committing to deliver at the same velocity as the data indicates
the team has predictably delivered in the past. Finally, simply asking the question in the Team Effectiveness
survey and conducting deep dive discussions to identify drivers combined with follow-through on the
associated actions should result in increased sustainability for the team. Drive continuous improvement
in work-life balance by using the “Work-Life Balance” Retrospective Board template, following the
standard retrospective process.
- Best practices for improving **confidence** include sharing Objectives and Key Results (OKRs) from
different levels across your organization. Bringing transparency into the OKRs can help teams and
individuals better understand how their work aligns to the organizations' priorities and can build
confidence in doing the right work to deliver against those OKRs.
- Best practices for improving **efficiency** can also include the implementation of agile practices
including backlog refinement and prioritization. Limiting Work In Process by establishing WIP limits
and adhering to them enables teams to be more efficient so they can "stop starting and start finishing"!

## Contribute

See [Contributing Guideline](./CONTRIBUTING.md)

## License

Copyright (c) Microsoft Corporation. All rights reserved.
