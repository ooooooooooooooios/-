// ==UserScript==
// @name         깡갤 원터치툴 연동 DeepL api 번역
// @namespace    http://your-namespace.com
// @version      0.2
// @description  Translate text inside #extracted-text inside #t-wide to Korean using DeepL API on novelai.net
// @author       ㅇㅇ
// @match        https://novelai.net/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function () {
  "use strict";

  const apiKey = " api 키 입력"; // Replace with your DeepL API key

  function translateText(text, targetLanguage, callback) {
    const apiUrl = "https://api-free.deepl.com/v2/translate";
    const requestData = {
      auth_key: apiKey,
      text: text,
      source_lang: "EN",
      target_lang: targetLanguage,
    };

    fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: Object.entries(requestData)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join("&"),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.translations && data.translations.length > 0) {
          const translatedText = data.translations[0].text;
          callback(translatedText);
        } else {
          console.error("Translation failed. Response:", data);
        }
      })
      .catch((error) => {
        console.error("Translation error:", error);
      });
  }

  // 번역하기 버튼의 클릭 이벤트에서 호출되는 translatePage 함수
  // 번역을 호출하기 전에 원본 텍스트를 조작하여 `br` 태그를 유니코드 토큰으로 대체하는 함수
  function preserveBreaks(originalText) {
    // 예: `br` 태그를 '[[BR]]' 문자열로 바꾸기
    return originalText.replace(/<br\s*[\/]?>/gi, "[[BR]]");
  }

  // 번역된 텍스트를 조작하여 `[[BR]]` 토큰을 `br` 태그로 복원하는 함수
  function restoreBreaks(translatedText) {
    // 문자열 '[[BR]]'을 `<br>` 태그로 바꾸기
    return translatedText.replace(/\[\[BR\]\]/g, "<br>");
  }

  // 번역을 수행하고, 번역된 텍스트를 #extracted-text 요소에 삽입하는 함수
  function translatePage() {
    const extractedTextElement = document.querySelector(
      "#t-wide #extracted-text"
    );
    if (extractedTextElement) {
      const originalHtml = extractedTextElement.innerHTML; // HTML 구조를 포함한 내용
      const textToTranslate = originalHtml;

      translateText(textToTranslate, "KO", function (translatedText) {
        extractedTextElement.innerHTML = translatedText; // 번역된 텍스트로 내용을 교체 (HTML 구조 포함)
      });
    }
  }

  function getExtractedText(length) {
    // 본문 내용 추출
    var proseMirrorDiv = document.querySelector(".ProseMirror");
    var paragraphs = proseMirrorDiv.querySelectorAll("p");
    var pText = "";
    for (var i = paragraphs.length - 1; i >= 0; i--) {
      var paragraphText = paragraphs[i].textContent;
      pText = paragraphText + "<br>" + pText;
      if (pText.length >= length) {
        break;
      }
    }

    // 페이지 스타일 업데이트
    updateTextStyle();

    // 추출된 텍스트에 스타일 적용
    extractedTextElement.innerHTML = translatedText;
  }

  // 'pText'에 대한 스타일을 적용하는 함수
  function applyStyleToQuotes(text) {
    const quoteRegex = /"([^"]+)"/g; // 조정된 정규식
    return text.replace(quoteRegex, (match, p1) => {
      // 올바른 HTML 태그를 사용해 'hT' 클래스를 문자열 내에 적용
      return `"${p1}"`;
    });
  }

  // 번역된 텍스트에 스타일을 적용하고, 문서에 반영하는 함수
  function handleTranslatedText(translatedText) {
    // 스타일이 적용된 텍스트 생성
    const withStyledQuotes = applyStyleToQuotes(translatedText);
    // 번역된 텍스트를 문서 내 해당 요소에 반영
    document.querySelector("#extracted-text").innerHTML = withStyledQuotes;
  }

  function createTranslateButton() {
    const button = document.createElement("button");
    button.textContent = "번역하기";
    button.style.position = "fixed";
    button.style.top = "10px";
    button.style.right = "10px"; // Set the right position to 10px

    // Apply styles
    button.style.color = "var(--Tmain-color)";
    button.style.background = "var(--loader-color)";
    button.style.border = "1px solid var(--loader-color)";
    button.style.borderRadius = "4px";

    document.body.appendChild(button);

    // Check #t-wide display property and set button z-index accordingly
    const tWideElement = document.querySelector("#t-wide");
    const observer = new MutationObserver(() => {
      button.style.zIndex =
        tWideElement.style.display === "flex" ? "9999" : "-1";
    });

    observer.observe(tWideElement, {
      attributes: true,
      attributeFilter: ["style"],
    });

    // Add click event listener to the button
    button.addEventListener("click", translatePage);
  }

  // Create and append the translation button when the page is loaded
  createTranslateButton();

  //   // 내용이 변경될 때 자동 번역을 시작하는 Observer 설정 함수
  //   function setupAutoTranslationObserver() {
  //     const extractedTextNode = document.querySelector("#extracted-text");
  //     const btnAuto = document.querySelector("#btnAuto");

  //     // #extracted-text 내용이 변경되는 것을 감지하기 위한 Observer 인스턴스 생성
  //     const observer = new MutationObserver((mutations) => {
  //       // #btnAuto에 btnOn 클래스가 있는지 확인
  //       if (btnAuto && btnAuto.classList.contains("btnOn")) {
  //         // 변경 사항을 감지하여 번역 진행
  //         for (let mutation of mutations) {
  //           if (
  //             (mutation.type === "childList" ||
  //               mutation.type === "characterData") &&
  //             mutation.target === extractedTextNode
  //           ) {
  //             const newText = mutation.target.textContent;
  //             if (newText.replace(/\s/g, "") !== "") {
  //               // 공백만으로 된 변경 무시
  //               translatePage();
  //               break; // 번역을 시작하면 추가 번역을 위한 감지 중단
  //             }
  //           }
  //         }
  //       }
  //     });

  //     // Observer 구성 및 실행
  //     observer.observe(extractedTextNode, {
  //       childList: true,
  //       characterData: true,
  //       subtree: true,
  //     });
  //   }

  //   // DOMContentLoaded 이벤트가 발생하면 자동 번역 옵저버 설정
  //   window.addEventListener("DOMContentLoaded", setupAutoTranslationObserver);
})();
