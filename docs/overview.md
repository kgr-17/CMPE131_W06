# Project Overview

Last updated: September 9, 2026

## Our Goal

Build a simple task organizer that helps people remember what they need to do and plan their time. Keep the website clean, easy to use, and in English.

## Where We Are Now

The first working version is ready for local testing. We can add tasks on the webpage and see them in a list. Tasks stay saved after refreshing the page or restarting the app.

## Progress

| Step | Status | What we have |
| --- | --- | --- |
| Project setup | Ready | React webpage, Express backend, PostgreSQL database, and Docker setup. |
| Add a task | Done | A task name and optional notes. |
| Save and show tasks | Done | Tasks are stored in the database and shown newest first. |
| Simple webpage | Done | Apple-inspired design that adjusts to desktop and phone screens. |
| English text | Done | English labels, dates, calendar, and error messages. |
| Time and location | Done | Optional location, start date and time, and end date and time. |
| Check the work | Done for current features | Automated tests, a production build, and browser checks passed. |
| Project records | Started | This overview and dated progress logs. |

## How to Try It

Follow the [setup instructions](../README.md#quick-start), then open <http://localhost:5173>.

Enter a task name. Add a location or notes if needed. Turn on **Date & time** to give the task a schedule, then select **Add task**.

## Possible Next Steps

These ideas are not built yet. The team can choose what to work on next.

- Mark a task as completed.
- Edit a task.
- Delete a task.
- Search or filter tasks.
- Add user accounts so each person has their own tasks. For now, tasks are shared.

## Keep This Record Updated

Update this overview when a project step changes. Keep daily details in the [log folder](log/), using one file per day named `YYYY-MM-DD.md`. Add more notes to the same file if more work happens that day.

- [September 9, 2026](log/2026-09-09.md): First backend feature, webpage, English text, scheduling, and location.

## Other Guides

- [Project README](../README.md): How to start and use the app.
- [Docker guide](DOCKER.md): Setup and troubleshooting.
- [API guide](API.md): How the webpage talks to the backend.
