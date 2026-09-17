# Project Overview

Last updated: September 17, 2026

## Our Goal

Build a simple task organizer that helps people remember what they need to do and plan their time. Keep the website clean, easy to use, and in English.

## Where We Are Now

We can add tasks with an optional estimated time, location, and schedule. A deadline does not need a start time. The Priority section shows the earliest deadlines, and the Calendar section shows tasks by day. Tasks stay saved after refreshing the page or restarting the app.

## Progress

| Step | Status | What we have |
| --- | --- | --- |
| Project setup | Ready | React webpage, Express backend, PostgreSQL database, and Docker setup. |
| Add a task | Done | A task name and optional notes. |
| Save and show tasks | Done | Tasks are stored in the database and shown newest first. |
| Simple webpage | Done | Apple-inspired design that adjusts to desktop and phone screens. |
| English text | Done | English labels, dates, calendar, and error messages. |
| Time and location | Done | Optional location, start date and time, and end date and time. |
| Optional start time | Done | Add a deadline without choosing a start time. |
| Estimated time | Done | Optional minutes or hours, saved with the task. |
| Priority section | Done | Pending tasks with the earliest end time first; overdue tasks are marked. |
| Calendar section | Done | Browse months and select a day to see its tasks. |
| Recommendation system | To do | A teammate is designing the logic. No implementation yet. |
| Check the work | Phone visual check remaining | All 60 tests, the production build, and desktop browser checks passed. |
| Project records | Started | This overview and dated progress logs. |

## How to Try It

Follow the [setup instructions](../README.md#quick-start), then open <http://localhost:5173>.

Enter a task name. Add a location, estimated time, or notes if needed. Turn on **Date & time** for a deadline; optionally choose **Include a start time**. Select **Add task**, then use Priority, Calendar, or All tasks to view it.

## Possible Next Steps

These ideas are not built yet. The team can choose what to work on next.

- Recommendation system: wait for the teammate's design, then agree on which extra information should affect priority. See the [to-do list](TODO.md).
- Check the Calendar layout on a phone.
- Mark a task as completed.
- Edit a task.
- Delete a task.
- Search or filter tasks.
- Add user accounts so each person has their own tasks. For now, tasks are shared.

## Keep This Record Updated

Update this overview when a project step changes. Keep daily details in the [log folder](log/), using one file per day named `YYYY-MM-DD.md`. Add more notes to the same file if more work happens that day.

- [September 9, 2026](log/2026-09-09.md): First backend feature, webpage, English text, scheduling, and location.
- [September 17, 2026](log/2026-09-17.md): Optional start times, estimates, Priority, Calendar, and a to-do entry for recommendations.

## Other Guides

- [Project README](../README.md): How to start and use the app.
- [Docker guide](DOCKER.md): Setup and troubleshooting.
- [API guide](API.md): How the webpage talks to the backend.
