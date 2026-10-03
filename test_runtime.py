import asyncio
from playwright.async_api import async_playwright
import http.server
import socketserver
import threading
import time

PORT = 8085

def run_server():
    Handler = http.server.SimpleHTTPRequestHandler
    httpd = socketserver.TCPServer(("", PORT), Handler)
    httpd.serve_forever()

server_thread = threading.Thread(target=run_server, daemon=True)
server_thread.start()
time.sleep(1)

async def test_game():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={'width': 1280, 'height': 800})
        await page.goto(f'http://localhost:{PORT}/index.html')

        # Start game
        await page.click('#btn-start-mission')
        await page.fill('#agent-name-input', 'AgentTest')
        await page.click('#name-form button[type="submit"]')

        # Jump directly to Mission 4 Phase 4
        await page.evaluate('''() => {
            gameState.currentMission = 4;
            gameState.m4Phase = 4;
            gameState.currentOptions = [];
            gameState.selectedOptionId = null;
            gameState.selectedWasCorrect = false;
            loadMission4();
            showScreen('screen-mission');
        }''')

        await asyncio.sleep(0.5)

        # 1. Check IDLE State
        options = await page.query_selector_all('.option-btn')
        print(f"Found {len(options)} options in M4 Phase 4")

        classes = []
        texts = []
        for opt in options:
            cls = await opt.get_attribute('class')
            txt = await opt.inner_text()
            classes.append(cls)
            texts.append(txt)
            print(f"Option: '{txt}' -> Class: '{cls}'")

        assert all('btn-secondary' in c for c in classes), "All options must start with btn-secondary!"
        assert not any('btn-success' in c or 'correct-selected' in c or 'incorrect-selected' in c for c in classes), "No option should be green or red in idle state!"

        await page.screenshot(path='screenshot-m4p4-idle.png')
        print("PASS: Idle state check verified. Screenshot saved.")

        # 2. Click wrong answer ('Mathematics and Science')
        wrong_btn = None
        for opt in options:
            txt = await opt.inner_text()
            if 'Mathematics and Science' in txt:
                wrong_btn = opt
                break

        if wrong_btn:
            await wrong_btn.click()
            await asyncio.sleep(0.3)

            wrong_cls = await wrong_btn.get_attribute('class')
            print(f"After wrong click - Wrong option class: '{wrong_cls}'")
            assert 'incorrect-selected' in wrong_cls, "Clicked wrong option must have incorrect-selected class!"

            await page.screenshot(path='screenshot-m4p4-wrong.png')
            print("PASS: Incorrect click state check verified. Screenshot saved.")

            # Dismiss feedback modal
            await page.click('#btn-feedback-next')
            await asyncio.sleep(0.3)

        # 3. Click correct answer ('Science and English')
        correct_btn = None
        options_again = await page.query_selector_all('.option-btn')
        for opt in options_again:
            txt = await opt.inner_text()
            if 'Science and English' in txt:
                correct_btn = opt
                break

        if correct_btn:
            await correct_btn.click()
            await asyncio.sleep(0.3)

            correct_cls = await correct_btn.get_attribute('class')
            print(f"After correct click - Correct option class: '{correct_cls}'")
            assert 'correct-selected' in correct_cls, "Clicked correct option must have correct-selected class!"

            await page.screenshot(path='screenshot-m4p4-correct.png')
            print("PASS: Correct click state check verified. Screenshot saved.")

        await browser.close()

asyncio.run(test_game())
