# JO9 Normalizer Implementation Plan

> Implement inline; no subagents or external writes.

**Goal:** Build a usable Korean HTML workbench for 795×596 image framing and two-provider optional AI extension.
**Architecture:** Offline single-file frontend compiled from local CSS/JS; loopback-only Python relay with fixed provider URLs.
**Tech Stack:** Canvas, plain JavaScript, Python standard library; Node unittest/assert, Python unittest, Playwright for verification only.
**Spec:** docs/DESIGN.md

## Global Constraints
795×596 RGBA output. No anisotropic scaling. No originals overwritten. No credentials on disk.
No paid requests during construction/tests. No automatic provider fallback. Approval before batch.

## Review Focus
Transparent-vs-opaque input; duplicate file names; bounding-box vs anatomical landmarks;
failed/blocked image request without paid retry; originals unchanged outside editable region.

## Tasks
- [x] Write failing tests for geometry, masked composition, ZIP and provider request validation.
- [x] Implement core JS functions, offline UI, ZIP export and session save/load.
- [x] Implement secured local relay, provider adapters, fake-network tests and launchers.
- [x] Browser test offline and hosted mode with synthetic non-person samples; inspect screenshot.
- [x] Package HTML and ZIP, document limitations and verification evidence.
