# Retrospectives

![Coverage Badge](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/mhassaninmsft/b414faf6b91eaaa6ec7d82882be36935/raw/retrotool__heads_dev.json)

Retrospectives is an [Azure DevOps](https://dev.azure.com) extension to perform
_smart and efficient retrospectives from within the Azure DevOps pipeline._

Retrospectives are an important practice in becoming an effective team, allowing the team to gather feedback and continuously improve based on the feedback.

Research from the [2018 State of DevOps report](https://services.google.com/fh/files/misc/state-of-devops-2018.pdf) indicates that Elite teams are 1.5 times more likely to consistently hold retrospectives and use them to improve their work. Furthermore, a [2013 meta-analysis on teams](https://journals.sagepub.com/doi/full/10.1177/0018720812448394) indicates that teams that effectively debrief/conduct retrospectives are 20-25% more effective.

Teams often use external retrospective tools, white boards with Post-its, OneNote, etc. to conduct retrospectives. The data then needs to be collated, and any actionable items need to be created in your Azure DevOps pipeline.

The [Retrospectives extension](https://marketplace.visualstudio.com/items?itemName=ms-devlabs.team-retrospectives)
allows you to do all this and more from within Azure DevOps.

## Table of Contents

- [Retrospectives](#retrospectives)
  - [Features](#features)
  - [Install](#install)
  - [Use](#use)
  - [Best Practices](#best-practices)
  - [Contribute](#contribute)
  - [License](#license)

## Features

- Retrospectives in Azure DevOps
- Real time support for distributed retrospectives
- Ability to create Azure DevOps work items associated to feedback
- Create an emailable summary of a retrospective

## Install

The extension can be installed from [Azure DevOps Marketplace](https://marketplace.visualstudio.com/items?itemName=ms-devlabs.team-retrospectives).

## Use

Please note: the screenshot examples use light mode and dark mode interchangeably
because both are supported!

### 1. Open Retrospectives Extension

 Navigate to the Azure 'Boards' tab in your account on the left hand navigation.
Select the 'Retrospectives' tab under 'Boards'.

![A screenshot of the Azure DevOps left-hand navigation. Under the Boards
heading, the extension for the retrospective is darkened as though hovered by
a mouse.](https://github.com/microsoft/vsts-extension-retrospectives/raw/main/documentation/images/desktop/azdo-side-bar.png)

### 2. Pick The Team

You are now on the Retrospectives page. Select your Azure DevOps team from the
selector in the header.

![A screenshot of the Retrospective tool's Team dropdown. The selected team
is "Backend Team" and the selection is darkened as though the mouse is hovering
over.](https://github.com/microsoft/vsts-extension-retrospectives/raw/main/documentation/images/desktop/team-dropdown.png)

### 3. Create New Retrospective

Create a new retrospective using the 'Create Board' button. If this is your
first retrospective for your selected team, then press the "Create Board" button
in the center of the screen.

![A screenshot of the Retrospective main page. The screen is mostly empty
except for the top navigation of the tool. In the center there is a blue button
to 'Create Board.'](https://github.com/microsoft/vsts-extension-retrospectives/raw/main/documentation/images/desktop/create-first-retrospective.png)

If you have created a retrospective before for your selected team, then you
can select "Create a new retrospective" from the navigation drop down.

![A screenshot of the top navigation in the Retrospective tool, where the
'Board Actions' menu has been opened. The first option in the dropdown is
the 'Create New Retrospective.'](https://github.com/microsoft/vsts-extension-retrospectives/raw/main/documentation/images/desktop/create-new-retrospective-dropdown.png)

### 4. Choose Your Retrospective Settings

When you select **New Board** or **Create new retrospective** as above, you will see
the following dialog:

![A screenshot showing the modal box that controls the initial settings for
creating a retrospective board. The settings include: a text field for title
of the retrospective; a number input box for maximum votes per person; a
checkbox to include a Team Assessment; a checkbox to obscure the feedback of
others during the Collect Phase; a checkbox to include Retrospective Prime
Directive; and a section to pick the different columns to include in the
retrospective, either customized or loaded from predefined templates.](https://github.com/microsoft/vsts-extension-retrospectives/raw/main/documentation/images/desktop/create-new-retro-lightmode.png)

Please enter the appropriate information:

- **Retrospective Title**: Enter a title for the Retrospective.
- **Max Votes per User**: The maximum number of votes a participant has to
use in the "Vote" Phase.
- **Include Team Assessment**: Include a Team Assessment link at the top of
the board.
- **Only show feedback after Collect phase**: When selected, users cannot
see other users input until they have moved to another phase. Other users'
feedback will be blurred.
- **Display 'Retrospective Prime Directive**: Include a link to the 'Prime
Directive' at the top of the board.
- **Do not display names in feedback**: When checked, anonymize who creates
individual feedback items.
- **Columns**: You can either Apply from a preselected templates or individually
select and configure columns.

![A screenshot showing the dropdown of available templates for the retrospective
board. They represent the different columns that can be included.](https://github.com/microsoft/vsts-extension-retrospectives/raw/main/documentation/images/desktop/pick-retrospective-template-lightmode.png)

**Note:** Retrospective Title is the minimum 'required' information (other
fields can stay at default as needed). Ones the title is provided, the `Save`
button is enabled. Save the retrospective using the `Save` button.

### ... Or Select Another Board

Once you have created the retrospective board and you want to select a board
different from the currently displayed board, click on the board name and select
the desired board. You can use the search box to find the appropriate boards if
you have a large number of boards.

![A screenshot showing the dropdown for searching available retrospective
boards after they've been created. The current Retrospective Board is
"Retrospective for Sprint 8" and the selection for "Retrospective for
Sprint 7" is darkened as though hovered.](https://github.com/microsoft/vsts-extension-retrospectives/raw/main/documentation/images/desktop/retro-board-dropdown.png)

### 5. Share the Link to the Retrospective

Once you create a new retrospective, you can share a link to it to all participants.
Users can then access that link even from their mobile browsers to participate in
the retrospective. The extension offers real time synchronisation, so all users
will see the most upto date information without having to refresh the page.

![A screenshot of the dropdown from the Board Actions Menu. The option for
'Copy Retrsopectivelink Link' is darkened as though the mouse is hovering
over it.](https://github.com/microsoft/vsts-extension-retrospectives/raw/main/documentation/images/desktop/copy-retro-link.png)

### 6. The Five Phases of the Standard Retrospective

The number of columns in each retrospective is determined by the selection made
when making the new board. Regardless of the template, they still follow the same
sequence of five stages.

#### The Prime Directive

In this phase the facilitator sets the stage for the retrospective. It is recommended that you click on the Prime Directive and read it out loud for everyone to hear. Remind everyone that any issues that discovered will be assumed to be process problems, not people problems.

![A screenshot of the prime directive'](https://github.com/microsoft/vsts-extension-retrospectives/raw/main/documentation/images/desktop/prime-directive-lightmode.png)


#### Collect

In this phase feedback is collected from all participants. Users
can add feedback under any of the columns using the 'Add new card' button or by
double clicking the empty space of the column's background. Once feedback from
all users is collected, move onto the next phase.

![A screenshot of an example retrospective board column, showing the example
user Avery Axolotl writing in a feedback item that says 'Accidentally deleted
my branch on remote. Dang!'](https://github.com/microsoft/vsts-extension-retrospectives/raw/main/documentation/images/desktop/write-new-feedback-item.png)

If when creating a retrospective, the checkbox for "Do not display names on
feedback" is checked, then the cards will show no names, appearing anonymous.

If when creating a retrospective, the checkbox for 'Obscure the feedback of
others during the Collect Phase' was checked, then while typing the feedback
of others will not be shown, even if anonymous. You can only edit items that
you have created in this mode.

![A screenshot of a board that shows two columnds for "Mad" and "Sad." The each
column has two feedback items: one which has text visible and another where
there is a blur that obscures the text from another user.](https://github.com/microsoft/vsts-extension-retrospectives/raw/main/documentation/images/desktop/obscured-anonymous-feedback.png)

#### Group

In this phase, any similar feedback can be grouped together beneath
a "header" or champion item. If you feel 2 feedback items are similar, drag one
onto another to group them together. Dragging any item onto a group, will add items
to that group.

![A screenshot that shows a piece of feedback being dragged on top of another
due to their similarity. The item being dragged is semi-transparent.](https://github.com/microsoft/vsts-extension-retrospectives/raw/main/documentation/images/desktop/group-feedback-by-dragging.png)

If you would rather not drag you can use the feedback item's action menu
(the ellipsis '...') to "Group Feedback". This will bring up a search box and
you can type in the feedback item you would like to group your selected item
under.

![A screenshot that shows the selected feedback item's action menu. The
"Group Feedback" is darked as though a mouse is hovering.](https://github.com/microsoft/vsts-extension-retrospectives/raw/main/documentation/images/desktop/group-feedback-by-feedback-menu.png)

![A screenshot that shows a search bar. The word "team" has been typed in
and shows a feedback item has been found with that word.](https://github.com/microsoft/vsts-extension-retrospectives/raw/main/documentation/images/desktop/group-feedback-search-dialog.png)

Both methods of grouping will result in the item being grouped beneath the other.

![A screenshot that shows that one feedback from Fernando Flamingo is grouped
beneath Avery Axolotl's feedback because both discussed team bonding.](https://github.com/microsoft/vsts-extension-retrospectives/raw/main/documentation/images/desktop/grouped-feedback-expanded.png)

Once all similar items are grouped together, move on to the next phase.

#### Vote

In this phase, participants will individually go through all the feedback
items and vote on the ones they feel are important, by clicking on the 'Upvote'
icon. Users can reduce their number of votes on a specific item by clicking on the
'Downvote' icon.

Note the _Max Votes per User_ set by the board creator are displayed as the
denominator in a ratio of "Votes Used". Votes used by the user are updated in
real time as the user clicks on 'Upvote' and 'Downvote' icons.

![A screenshot that shows a user has used two votes out of five, which is
indicated next to "Votes Used." The two items that have been voted on by the
user show a "Your Votes: 1" in the feedback card.](https://github.com/microsoft/vsts-extension-retrospectives/raw/main/documentation/images/desktop/vote-feedback-in-progress.png)

Once everyone is done voting, move on to the next phase.

#### Act

In this phase, the team will go through each feedback item and create
work items in Azure DevOps if needed. Click on the 'Add action item' button on a
feedback card, and select the type of work item that needs to be created. This
will open up the standard Azure DevOps work item creation form. Enter the work
item details and save. This will create the work item in your Azure DevOps
account and also associate it to the feedback item.

![A screenshot that shows a feedback item in the 'Act Phase'. On the example
feedback items, the button for 'Add Action Item,' an ellipsis, has been pressed
to reveal a selection of options. The user has the option to create a number of
different Azure Dev Ops items, like adding a bug, a user story, and others. In
this case, the item that is darkened as though hovered by a mouse is the 'User
Story' option.](https://github.com/microsoft/vsts-extension-retrospectives/raw/main/documentation/images/desktop/add-action-item-dropdown.png)

### 7. Optional: The Team Assessment

You can optionally include a "Team Assessment" that anonymously collects
feedback from participants. To get the feedback form, you can click on the "Team
Assessment" link at the top of the board. The assessment tracks 5 categories:

- Clarity
- Energy
- Psychological Safety
- Work-life Balance
- Confidence

The users can rank on a scale of 1 to 10; scores of 1-6 are categorized as
"Unfavorable", 7 and 8 are "Neutral," and 9 and 10 are "Favorable."

![A screenshot of an example user filling out the team assessment. Each question
has alternating background for visual distinction. Each question/category has
a short description and a tooltip icon that provides more context.](https://github.com/microsoft/vsts-extension-retrospectives/raw/main/documentation/images/desktop/retro-team-assessment-darkmode.png)

Once the team assessment has been completed, the summary of answers can be viewed
in the Retrospective Summary Dialog (see below)

#### Improving Based on Team Assessment Scores

Teams may choose to address the issues found in the team assessment in multiple ways:

- Through open conversations during the standard retrospective process to identify opportunities for improvement.
  - While this approach works, it may not be effective if the team isn't psychologically safe, and our research indicates that only 10% of the teams that do team assessments are psychologically safe
- Through a Team Assessment Retrospective
  - A Team Assessment Retrospective is a new approach to retrospectives allowing teams to identify the largest opportunities for improvement based on each team members' responses to the team assessment. 
  -  Section 7.1 below outlines the Six Steps in a Team Assessment Retrospective
  
 ### 7.1 The Six Steps To a Team Assessment Retrospective

#### Setup

Create a new retrospective using the steps above with the following exceptions:
- Include Team Assessment is checked
- Do not display names in feedback is checked
- Display 'Retrospective Prime Directive' is checked
- Note: You do not need to select a template. The template will be modified after the assessment is complete
- Share the link to the retrospective with the team

---Add screenshot here---

#### The Prime Directive

In this phase the facilitator sets the stage for the retrospective. It is recommended that you click on the Prime Directive and read it out loud for everyone to hear. Remind everyone that any issues that discovered will be assumed to be process problems, not people problems.

![A screenshot of the prime directive'](https://github.com/microsoft/vsts-extension-retrospectives/raw/main/documentation/images/desktop/prime-directive-lightmode.png)

#### Team Assessment

In this phase each team member clicks on the Team Assessment and anonymously answers all questions and hits "submit". It is critical that you remind everyone that all feedback is anonymous and confidential. 

Throughout this phase you will periodically check the retrospective summary. If the majority of the team hasn't responded to the assessment, close the summary dialog and encourage everyone to participate, reminding them that if their voice isn't expressed in the assessment it can't be acted upon.

--Add screenshot here

Re-open the retrospective summary and when the majority of the team has responded, discuss which dimension the team would like to improve upon. Note: If more than 20% of the responses are unfavorable for psychological safety, we recommend focusing on psychological safety first. This is because without psychological safety the more difficult conversations that need to happen to make improvements in the other dimensions will not happen.

--Add screenshot here

Once the team has decided which dimension to focus on the facilitator edits the template by selecting the template aligned to the dimension the team wants to focus on. For example, if the team has decided to improve on psychological safety, then the facilitator will edit the retrospective and choose the "Psychological Safety" template.

---Add screenshot here---

##### Collect

In this phase team members will provide feedback to help improve the dimension they've chosen to focus on 

Ask team members to input feedback cards on the left 2 columns. 

---insert screenshot here

After a few moments, the facilitator reads the cards outloud. When it's apparent that no additional feedback cards are being added, the facilitator asks the following question: "Reflecting on the feedback we've collected, if you could take only one action in the next sprint that would yield the biggest improvement on [dimension team is focused on improving from Team Assessment] what would it be? Capture this in a feedback card in the third column (One action in the next sprint)"

---insert screenshot here

#### Group

In this phase the team will group similar items together. To expedite the process we recommend only grouping the action items together.

After the majority of the team has added feedback cards to the third column, the facilitator switches to the "group" tab and collectively groups like ideas together with the teeam (see above).

---insert screenshot here

#### Vote

In this step the facilitator asks participants to vote only on the third column and the top items for improvement are identified.

---insert screenshot here.

The facilitator then waits for votes to compile and after the majority of the team has voted (the facilitator can view the retrospective summary to quickly determine how many votes have beeen cast), the facilitator clicks on the "Act" tab which automatically sorts the cards from the most to the least voted upon.

#### Act

Follow the steps above to assign actions as work items in Azure Dev Ops. Note: We recommend only selecting 1-2 actions per sprint to ensure completion prior to the next sprint.

### 8. Retrospective Summary

 The Retrospective Summary dialog is accessable from the "Board Actions" menu
in the top navigation.

![A screenshot that shows the Board Actions menu, where the "Show Retrospective
Summary" is highlighted as though the mouse is hovering.](https://github.com/microsoft/vsts-extension-retrospectives/raw/main/documentation/images/desktop/show-retro-summary.png)

Once there, there is a summary of the Retrospective. This includes:

- Who created the board
- Number of participants
  - If not anonymous, it will show who participated
- Number of feedback items created
- Number of votes cast
- Number of action items created

![A screenshot that shows an example retrospective summary without a team assessment.](https://github.com/microsoft/vsts-extension-retrospectives/raw/main/documentation/images/desktop/retro-summary-no-assessment-darkmode.png)

If there is a team assessment, then a charted summary will show the vote breakdown
by favorability, along with an average score.

![A screenshot that shows an example retrospective summary with a team assessment.](https://github.com/microsoft/vsts-extension-retrospectives/raw/main/documentation/images/desktop/retro-summary-with-assessment-darkmode.png)

### 10. Board History

There may be times that a team may want to reflect on past retrospectives they have
run. There is a History tab in the top navigation of the tool, next to "Board" header.

![A screenshot that shows the history view tab. There is a table that shows four
columns: Retrospective Name, Created Date, Pending Work Items, and Total Work Items.](https://github.com/microsoft/vsts-extension-retrospectives/raw/main/documentation/images/desktop/history-view-darkmode.png)

From here, one can look at past retrospectives and see a few high level stats and
the action items created after each by clicking the individual retrospective.

![A screenshot that shows an expanded retrospective. On the left-hand side, there is the summary: how many feedback items were created, how many work items created, how many work items pending, and how many work items resolved. On the right-hand side, there is the list of work items in a table of their own. The work item table has the columns: Title, State, Type, Last Updated, Assigned To, and Priority. The work items have example data for three different items.](https://github.com/microsoft/vsts-extension-retrospectives/raw/main/documentation/images/desktop/history-view-expanded-summary-lightmode.png)

## Best Practices

## Contribute

See [Contributing Guideline](./CONTRIBUTING.md)

## License

Copyright (c) Microsoft Corporation. All rights reserved.
