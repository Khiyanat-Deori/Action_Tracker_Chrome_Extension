# Action_Tracker: A Chrome extension to track user actions on a webpage, which are stored in JSON format and can be used to train web agents.

## Dataset Summary

This dataset is designed to develop generalist web agents capable of following language instructions to complete complex tasks on any website. Existing datasets for web agents either rely on simulated websites or focus on a limited set of websites and tasks, making them unsuitable for training generalist web agents. Action_Tracker provides three crucial elements for building generalist web agents: 1) a wide range of domains, websites, and tasks, 2) the use of real-world websites rather than simplified or simulated ones, and 3) a comprehensive variety of user interaction patterns.

## Data Fields

- "website" (str): website name
- "domain" (str): website domain
- "subdomain" (str): website subdomain
- "confirmed_task" (str): task description
- "action_reprs" (list[str]): human readable string representation of the action sequence
- "actions" (list[dict]): list of actions (steps) to complete the task
  - "action" (str): each action representation (step)
  - "raw_html" (str): raw html of the page before the action is performed
  - "cleaned_html" (str): cleaned html of the page before the action is performed
  - "operation" (dict): operation to perform
    - "original_op" (str): original operation type, contain additional HOVER and ENTER that are mapped to CLICK
    - "value" (str): optional value for the operation, e.g., text to type, option to select
    - "op" (str): operation type, one of CLICK, TYPE, SELECT
  - "pos_candidate" (dict): ground truth element that represents the user action.
    - "tag" (str): tag of the element
    - "is_original_target" (bool): whether the element is the original target labeled by the annotator
    - "is_top_level_target" (bool): whether the element is a top level target find by the algorithm
  - "neg_candidates" (list[dict]): other interactive candidate elements in the page that has similar structure as "pos_candidate"

